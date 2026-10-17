// Trámites de un contrato ante la institución (entrevista al encargado de
// contratos): prórrogas del plazo, notas técnicas de contrato abierto y
// oficios de advertencia. Nada se borra: se anula con motivo.
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { TramiteContrato, Contrato, DetalleContrato, Pedido, ModalidadCompra } = require('../models/index');
const { manejarError, ErrorNegocio, exigirTexto } = require('../utils/errores');
const { registrarAuditoria, instantanea } = require('../utils/auditoria');
const { contarOficios } = require('./contratoController');
const { obtenerParametro } = require('../services/parametros');
const { hoy, esFechaValida, sumarDias, formatoGT } = require('../utils/fechas');

// Razones por las que el proveedor no puede entregar a tiempo. Las primeras
// cuatro están fuera de sus manos (fuerza mayor) y por eso la prórroga suele
// aprobarse rápido si la empresa tiene buen récord de entregas.
const CAUSAS_PRORROGA = {
    materia_prima: 'El fabricante no tiene materia prima',
    produccion: 'Problemas de producción del fabricante',
    importacion: 'Atraso en la importación',
    fuerza_mayor: 'Otra causa de fuerza mayor (pandemia, conflicto...)',
    otra: 'Otra causa'
};
const FUERZA_MAYOR = ['materia_prima', 'produccion', 'importacion', 'fuerza_mayor'];

const CAUSAS_OFICIO = {
    atraso_entrega: 'Atraso en la entrega',
    entrega_incompleta: 'Entrega incompleta',
    calidad_producto: 'Calidad o vida útil del producto',
    documentacion: 'Documentación incompleta',
    otra: 'Otra causa'
};

const DIAS_NOTA_TECNICA = 30;

const ETIQUETA = { prorroga: 'Prórroga', nota_tecnica: 'Nota técnica', oficio: 'Oficio' };

const cargarContrato = (id, transaction) => Contrato.findByPk(id, {
    include: [{ model: ModalidadCompra, attributes: ['nombre', 'contrato_abierto'] }, DetalleContrato],
    transaction, lock: { level: transaction.LOCK.UPDATE, of: Contrato }
});

const fechaValida = (valor, mensaje) => {
    if (!esFechaValida(valor)) throw new ErrorNegocio(mensaje);
    return valor;
};

// Body: { id_contrato, tipo, numero_documento, fecha_documento, causa, descripcion,
//         fecha_hasta (prórroga: nuevo fin), fecha_desde/fecha_hasta (nota técnica),
//         id_detalle_contrato (nota técnica), id_pedido (oficio, opcional) }
const crearTramite = async (req, res) => {
    try {
        const { tipo } = req.body;
        if (!TramiteContrato.TIPOS.includes(tipo)) throw new ErrorNegocio('Tipo de trámite no válido.');
        const descripcion = exigirTexto(req.body.descripcion, tipo === 'oficio' ? 'Describe qué reclama el oficio.' : 'Describe la justificación y los documentos de respaldo.');
        const numero = exigirTexto(req.body.numero_documento, tipo === 'oficio' ? 'Indica el número del oficio.' : 'Indica el número de la solicitud o del expediente.');
        const fechaDoc = fechaValida(req.body.fecha_documento || hoy(), 'La fecha del documento no es válida.');
        if (fechaDoc > hoy()) throw new ErrorNegocio('La fecha del documento no puede ser futura.');

        let resultado;
        await sequelize.transaction(async (transaction) => {
            const contrato = await cargarContrato(req.body.id_contrato, transaction);
            if (!contrato) throw new ErrorNegocio('Contrato no encontrado.', 404);
            if (['anulado', 'cancelado'].includes(contrato.estado)) throw new ErrorNegocio(`El contrato está ${contrato.estado}.`);
            const datos = {
                id_contrato: contrato.id_contrato, tipo, numero_documento: numero.slice(0, 100), fecha_documento: fechaDoc,
                descripcion, id_usuario: req.usuario.id
            };

            if (tipo === 'prorroga') {
                if (!CAUSAS_PRORROGA[req.body.causa]) throw new ErrorNegocio('Selecciona la causa de la prórroga.');
                // La prórroga se tramita antes de que venza; con el contrato vencido ya no hay presupuesto habilitado
                if (contrato.estado !== 'vigente' || fechaDoc > contrato.fecha_fin) {
                    throw new ErrorNegocio(`La prórroga se solicita antes de que venza el contrato (${formatoGT(contrato.fecha_fin)}). Con el contrato vencido ya no se pueden hacer entregas: la institución debe comprar por otra modalidad.`);
                }
                const nuevoFin = fechaValida(req.body.fecha_hasta, 'Indica la nueva fecha de fin que se solicita.');
                if (nuevoFin <= contrato.fecha_fin) throw new ErrorNegocio(`La nueva fecha de fin debe ser posterior a la actual (${formatoGT(contrato.fecha_fin)}).`);
                const pendiente = await TramiteContrato.count({ where: { id_contrato: contrato.id_contrato, tipo: 'prorroga', estado: 'solicitada' }, transaction });
                if (pendiente) throw new ErrorNegocio('El contrato ya tiene una prórroga en trámite; registra primero su resolución.');
                Object.assign(datos, { causa: req.body.causa, fecha_fin_anterior: contrato.fecha_fin, fecha_hasta: nuevoFin, estado: 'solicitada' });
            }

            if (tipo === 'nota_tecnica') {
                if (!contrato.ModalidadCompra?.contrato_abierto) throw new ErrorNegocio('La nota técnica solo aplica a contratos abiertos.');
                if (contrato.estado !== 'vigente') throw new ErrorNegocio('El contrato no está vigente.');
                if (!CAUSAS_PRORROGA[req.body.causa]) throw new ErrorNegocio('Selecciona por qué no se puede abastecer el producto.');
                const renglon = contrato.DetalleContratos.find(r => String(r.id_detalle_contrato) === String(req.body.id_detalle_contrato) && r.activo);
                if (!renglon) throw new ErrorNegocio('Selecciona el renglón que no se puede abastecer.');
                const desde = fechaValida(req.body.fecha_desde || fechaDoc, 'La fecha de inicio no es válida.');
                const hasta = req.body.fecha_hasta ? fechaValida(req.body.fecha_hasta, 'La fecha de fin no es válida.') : sumarDias(desde, DIAS_NOTA_TECNICA);
                if (hasta <= desde) throw new ErrorNegocio('La fecha de fin debe ser posterior a la de inicio.');
                Object.assign(datos, { causa: req.body.causa, id_detalle_contrato: renglon.id_detalle_contrato, fecha_desde: desde, fecha_hasta: hasta > contrato.fecha_fin ? contrato.fecha_fin : hasta, estado: 'solicitada' });
            }

            if (tipo === 'oficio') {
                if (!CAUSAS_OFICIO[req.body.causa]) throw new ErrorNegocio('Selecciona la causa del oficio.');
                let idPedido = null;
                if (req.body.id_pedido) {
                    const pedido = await Pedido.findByPk(req.body.id_pedido, { transaction });
                    if (!pedido || pedido.id_contrato !== contrato.id_contrato) throw new ErrorNegocio('El pedido no pertenece a este contrato.');
                    idPedido = pedido.id_pedido;
                }
                Object.assign(datos, { causa: req.body.causa, id_pedido: idPedido, estado: 'registrado' });
            }

            const tramite = await TramiteContrato.create(datos, { transaction });
            await registrarAuditoria({ req, tabla: 'tramites_contrato', id_registro: tramite.id_tramite, accion: 'crear', despues: tramite, motivo: `${ETIQUETA[tipo]} ${numero} del contrato ${contrato.numero_contrato}`, transaction });

            let advertencia = null;
            if (tipo === 'oficio' && !contrato.ModalidadCompra?.contrato_abierto) {
                const [oficios, limite] = await Promise.all([contarOficios(contrato.id_institucion, transaction), obtenerParametro('LIMITE_OFICIOS')]);
                if (oficios >= limite) advertencia = `La institución ya envió ${oficios} oficios de advertencia: puede dejar de comprarnos. Hay que atender sus reclamos de inmediato.`;
                else if (oficios === limite - 1) advertencia = `Es el oficio ${oficios} de ${limite}: con uno más la institución puede dejar de comprarnos.`;
            }
            resultado = { tramite, advertencia };
        });
        res.status(201).json({ mensaje: `${ETIQUETA[tipo]} ${tipo === 'oficio' ? 'registrado' : 'registrada'}`, ...resultado });
    } catch (error) { manejarError(res, error, 'Error al registrar el trámite'); }
};

// Lo que resolvió la institución sobre una prórroga o nota técnica.
// Body: { estado: 'aprobada' | 'rechazada', fecha_resolucion, observacion }
const resolverTramite = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!['aprobada', 'rechazada'].includes(estado)) throw new ErrorNegocio('Indica si la institución aprobó o rechazó la solicitud.');
        const observacion = exigirTexto(req.body.observacion, 'Indica la resolución o el documento con que respondió la institución.');
        const fecha = fechaValida(req.body.fecha_resolucion || hoy(), 'La fecha de la resolución no es válida.');
        if (fecha > hoy()) throw new ErrorNegocio('La fecha de la resolución no puede ser futura.');
        let mensaje;
        await sequelize.transaction(async (transaction) => {
            const tramite = await TramiteContrato.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!tramite) throw new ErrorNegocio('Trámite no encontrado', 404);
            if (tramite.estado !== 'solicitada') throw new ErrorNegocio('Solo se resuelve una solicitud en trámite.');
            if (fecha < tramite.fecha_documento) throw new ErrorNegocio('La resolución no puede ser anterior a la solicitud.');
            const antes = instantanea(tramite);
            await tramite.update({ estado, fecha_resolucion: fecha, observacion_resolucion: observacion, id_usuario_resolucion: req.usuario.id }, { transaction });
            await registrarAuditoria({ req, tabla: 'tramites_contrato', id_registro: tramite.id_tramite, accion: 'cambio_estado', antes, despues: tramite, motivo: observacion, transaction });
            mensaje = `${ETIQUETA[tramite.tipo]} ${estado}.`;

            // Prórroga aprobada: el contrato termina en la nueva fecha (y vuelve a estar vigente si venció mientras se resolvía)
            if (tramite.tipo === 'prorroga' && estado === 'aprobada') {
                const contrato = await cargarContrato(tramite.id_contrato, transaction);
                if (['anulado', 'cancelado'].includes(contrato.estado)) throw new ErrorNegocio(`El contrato está ${contrato.estado}; no se puede prorrogar.`);
                const antesContrato = instantanea(contrato);
                const cambios = { fecha_fin: tramite.fecha_hasta };
                if (contrato.estado === 'vencido' && tramite.fecha_hasta >= hoy()) cambios.estado = 'vigente';
                await contrato.update(cambios, { transaction });
                await registrarAuditoria({ req, tabla: 'contratos', id_registro: contrato.id_contrato, accion: 'editar', antes: antesContrato, despues: contrato, motivo: `Prórroga ${tramite.numero_documento} aprobada: nuevo fin ${formatoGT(tramite.fecha_hasta)}`, transaction });
                mensaje = `Prórroga aprobada. El contrato ahora termina el ${formatoGT(tramite.fecha_hasta)}.`;
            }
        });
        res.json({ mensaje });
    } catch (error) { manejarError(res, error, 'Error al resolver el trámite'); }
};

// Anula un trámite registrado por error. Si era una prórroga aprobada, el
// contrato regresa a su fecha de fin anterior.
const anularTramite = async (req, res) => {
    try {
        const motivo = exigirTexto(req.body?.motivo, 'Indica el motivo de la anulación.');
        await sequelize.transaction(async (transaction) => {
            const tramite = await TramiteContrato.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!tramite) throw new ErrorNegocio('Trámite no encontrado', 404);
            if (tramite.estado === 'anulado') throw new ErrorNegocio('El trámite ya está anulado.');
            if (tramite.tipo === 'prorroga' && tramite.estado === 'aprobada') {
                const contrato = await cargarContrato(tramite.id_contrato, transaction);
                const posterior = await TramiteContrato.count({
                    where: { id_contrato: tramite.id_contrato, tipo: 'prorroga', estado: { [Op.in]: ['solicitada', 'aprobada'] }, id_tramite: { [Op.gt]: tramite.id_tramite } },
                    transaction
                });
                if (posterior || contrato.fecha_fin !== tramite.fecha_hasta) throw new ErrorNegocio('Hay una prórroga posterior; anúlala primero.');
                const antesContrato = instantanea(contrato);
                const cambios = { fecha_fin: tramite.fecha_fin_anterior };
                if (['vigente', 'vencido'].includes(contrato.estado)) cambios.estado = tramite.fecha_fin_anterior < hoy() ? 'vencido' : 'vigente';
                await contrato.update(cambios, { transaction });
                await registrarAuditoria({ req, tabla: 'contratos', id_registro: contrato.id_contrato, accion: 'editar', antes: antesContrato, despues: contrato, motivo: `Anulación de la prórroga ${tramite.numero_documento}: ${motivo}`, transaction });
            }
            const antes = instantanea(tramite);
            await tramite.update({ estado: 'anulado' }, { transaction });
            await registrarAuditoria({ req, tabla: 'tramites_contrato', id_registro: tramite.id_tramite, accion: 'anular', antes, despues: tramite, motivo, transaction });
        });
        res.json({ mensaje: 'Trámite anulado' });
    } catch (error) { manejarError(res, error, 'Error al anular el trámite'); }
};

// Catálogo de causas para los formularios
const getCausas = (req, res) => res.json({ prorroga: CAUSAS_PRORROGA, nota_tecnica: CAUSAS_PRORROGA, oficio: CAUSAS_OFICIO, fuerza_mayor: FUERZA_MAYOR, dias_nota_tecnica: DIAS_NOTA_TECNICA });

module.exports = { crearTramite, resolverTramite, anularTramite, getCausas, CAUSAS_PRORROGA, CAUSAS_OFICIO, FUERZA_MAYOR, ETIQUETA };
