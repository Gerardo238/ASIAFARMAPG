// Los lotes nacen solo desde un ingreso de compra (ver ingresoController) y
// nunca se borran. Aquí se consultan, se corrigen datos (con motivo y
// auditoría) y se cambia su condición (cuarentena, bloqueo por retiro, ...).
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Lote, Producto, Laboratorio, Ubicacion, Ingreso, Proveedor, Movimiento, MotivoMovimiento } = require('../models/index');
const { manejarError, ErrorNegocio, exigirTexto } = require('../utils/errores');
const { registrarAuditoria, instantanea } = require('../utils/auditoria');
const { obtenerParametros } = require('../services/parametros');
const { validarFechasLote, semaforo, registrarMovimiento, obtenerMotivo } = require('../services/inventario');
const { hoy, sumarMeses } = require('../utils/fechas');

const INCLUDE_LOTE = [
    { model: Producto, attributes: ['id_producto', 'nombre', 'codigo', 'concentracion'] },
    { model: Laboratorio, attributes: ['id_laboratorio', 'nombre'] },
    { model: Ubicacion, attributes: ['id_ubicacion', 'nombre'] },
    {
        model: Ingreso, attributes: ['id_ingreso', 'serie_factura', 'numero_factura', 'fecha_recepcion', 'estado'],
        include: [{ model: Proveedor, attributes: ['id_proveedor', 'nombre'] }]
    }
];

const enriquecer = (lote, parametros) => {
    const datos = lote.get({ plain: true });
    const fechaMinDespacho = sumarMeses(hoy(), parametros.VIGENCIA_MINIMA_DESPACHO_MESES);
    return {
        ...datos,
        semaforo: semaforo(datos.fecha_vencimiento, parametros),
        apto_despacho: datos.condicion === 'disponible' && Number(datos.cantidad_disponible) > 0 && datos.fecha_vencimiento >= fechaMinDespacho
    };
};

// Filtros: buscar (nombre o código del producto, laboratorio o número de lote),
// id_producto, id_laboratorio, id_proveedor, condicion, numero_lote
const getLotes = async (req, res) => {
    try {
        const parametros = await obtenerParametros();
        const { buscar, id_producto, id_laboratorio, id_proveedor, condicion, numero_lote, con_existencia } = req.query;
        const where = {};
        if (id_producto) where.id_producto = id_producto;
        if (id_laboratorio) where.id_laboratorio = id_laboratorio;
        if (condicion) where.condicion = condicion;
        if (numero_lote) where.numero_lote = { [Op.iLike]: `%${numero_lote.trim()}%` };
        if (con_existencia) where.cantidad_disponible = { [Op.gt]: 0 };
        if (id_proveedor) where['$Ingreso.id_proveedor$'] = id_proveedor;
        if (buscar && buscar.trim()) {
            const texto = `%${buscar.trim()}%`;
            where[Op.or] = [
                { numero_lote: { [Op.iLike]: texto } },
                { '$Producto.nombre$': { [Op.iLike]: texto } },
                { '$Producto.codigo$': { [Op.iLike]: texto } },
                { '$Laboratorio.nombre$': { [Op.iLike]: texto } }
            ];
        }

        const lotes = await Lote.findAll({ where, include: INCLUDE_LOTE, order: [['fecha_vencimiento', 'ASC'], ['id_lote', 'ASC']] });
        res.json(lotes.map(l => enriquecer(l, parametros)));
    } catch (error) { manejarError(res, error, 'Error al obtener lotes'); }
};

const getLote = async (req, res) => {
    try {
        const parametros = await obtenerParametros();
        const lote = await Lote.findByPk(req.params.id, { include: INCLUDE_LOTE });
        if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado' });
        res.json(enriquecer(lote, parametros));
    } catch (error) { manejarError(res, error, 'Error al obtener lote'); }
};

// Lotes con existencia en semáforo rojo/amarillo o ya vencidos
const getLotesAlerta = async (req, res) => {
    try {
        const parametros = await obtenerParametros();
        const lotes = await Lote.findAll({
            where: {
                cantidad_disponible: { [Op.gt]: 0 },
                condicion: { [Op.in]: ['disponible', 'cuarentena', 'bloqueado', 'vencido'] }
            },
            include: INCLUDE_LOTE,
            order: [['fecha_vencimiento', 'ASC']]
        });
        res.json(lotes.map(l => enriquecer(l, parametros)).filter(l => l.semaforo.color !== 'verde'));
    } catch (error) { manejarError(res, error, 'Error al obtener alertas'); }
};

// Corrección de datos del lote. Las cantidades NO se editan aquí (solo con
// movimientos). Cambiar fechas es crítico: solo el administrador puede y
// siempre con motivo; queda el antes y el después en la auditoría.
const updateLote = async (req, res) => {
    try {
        const motivo = exigirTexto(req.body.motivo, 'Indica el motivo de la corrección.');
        const lote = await Lote.findByPk(req.params.id);
        if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado' });
        if (lote.condicion === 'anulado') throw new ErrorNegocio('El lote pertenece a un ingreso anulado; restaura el ingreso primero.');

        const datos = {};
        ['numero_lote', 'id_laboratorio', 'id_ubicacion', 'costo_unitario', 'fecha_fabricacion', 'fecha_vencimiento'].forEach(c => {
            if (req.body[c] !== undefined && req.body[c] !== '' && String(req.body[c]) !== String(lote[c])) datos[c] = req.body[c];
        });
        if (Object.keys(datos).length === 0) throw new ErrorNegocio('No hay cambios para guardar.');

        const cambiaFechas = 'fecha_fabricacion' in datos || 'fecha_vencimiento' in datos;
        if (cambiaFechas && req.usuario.rol !== 'administrador') {
            throw new ErrorNegocio('Solo un administrador puede cambiar las fechas de un lote.', 403);
        }
        if (cambiaFechas) {
            validarFechasLote({
                fecha_fabricacion: datos.fecha_fabricacion ?? lote.fecha_fabricacion,
                fecha_vencimiento: datos.fecha_vencimiento ?? lote.fecha_vencimiento
            });
        }
        if (datos.numero_lote) datos.numero_lote = String(datos.numero_lote).trim().toUpperCase();
        if (datos.costo_unitario !== undefined && Number(datos.costo_unitario) < 0) throw new ErrorNegocio('El costo no puede ser negativo.');

        await sequelize.transaction(async (transaction) => {
            const antes = instantanea(lote);
            // Si la nueva fecha de vencimiento ya pasó, el lote queda vencido;
            // si se corrige un vencido a una fecha futura, vuelve a disponible.
            const venc = datos.fecha_vencimiento ?? lote.fecha_vencimiento;
            if (venc < hoy() && ['disponible', 'agotado'].includes(lote.condicion) && Number(lote.cantidad_disponible) > 0) datos.condicion = 'vencido';
            if (venc >= hoy() && lote.condicion === 'vencido') datos.condicion = Number(lote.cantidad_disponible) > 0 ? 'disponible' : 'agotado';
            await lote.update(datos, { transaction });
            await registrarAuditoria({ req, tabla: 'lotes', id_registro: lote.id_lote, accion: 'editar', antes, despues: lote, motivo, transaction });
        });
        res.json({ mensaje: 'Lote actualizado. El cambio quedó registrado en la auditoría.', lote });
    } catch (error) { manejarError(res, error, 'Error al actualizar lote'); }
};

// Cuarentena / bloqueo (ej. retiro del mercado por un lote defectuoso) / liberar
const cambiarCondicion = async (req, res) => {
    try {
        const { condicion } = req.body;
        const motivo = exigirTexto(req.body.motivo, 'Indica el motivo del cambio de condición.');
        if (!['disponible', 'cuarentena', 'bloqueado'].includes(condicion)) {
            throw new ErrorNegocio('Condición no válida. Usa disponible, cuarentena o bloqueado.');
        }
        const lote = await Lote.findByPk(req.params.id);
        if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado' });
        if (['anulado', 'vencido'].includes(lote.condicion)) throw new ErrorNegocio(`Un lote ${lote.condicion} no puede cambiar de condición.`);
        if (lote.condicion === condicion) throw new ErrorNegocio(`El lote ya está en ${condicion}.`);

        let nueva = condicion;
        if (condicion === 'disponible' && Number(lote.cantidad_disponible) === 0) nueva = 'agotado';

        const antes = instantanea(lote);
        await lote.update({ condicion: nueva, motivo_condicion: motivo });
        await registrarAuditoria({ req, tabla: 'lotes', id_registro: lote.id_lote, accion: 'cambio_estado', antes, despues: lote, motivo });
        res.json({ mensaje: `Lote ${lote.numero_lote} ahora está ${nueva}.`, lote });
    } catch (error) { manejarError(res, error, 'Error al cambiar la condición del lote'); }
};

// Salidas reales del lote (despachos, mermas, ajustes...). Las salidas que
// hace el propio sistema al anular un lote o su factura no cuentan.
const CODIGOS_ANULACION = ['ANULACION_INGRESO', 'ANULACION_LOTE'];
const contarSalidasReales = (id_lote, transaction) => Movimiento.count({
    where: { id_lote, tipo_movimiento: 'salida' },
    include: [{ model: MotivoMovimiento, attributes: [], where: { codigo: { [Op.or]: [{ [Op.notIn]: CODIGOS_ANULACION }, { [Op.is]: null }] } } }],
    transaction
});

// Caso 9: un lote registrado por error (por ejemplo, duplicado) se anula, no
// se borra. Deja de contar en la existencia, en FEFO y en las alertas, y
// un administrador puede restaurarlo. No se permite si ya tuvo salidas,
// porque rompería la trazabilidad de lo que ya se entregó.
const anularLote = async (req, res) => {
    try {
        const motivoTexto = exigirTexto(req.body?.motivo, 'Indica el motivo de la anulación.');
        let lote;
        await sequelize.transaction(async (transaction) => {
            lote = await Lote.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!lote) throw new ErrorNegocio('Lote no encontrado', 404);
            if (lote.condicion === 'anulado') throw new ErrorNegocio('El lote ya está anulado.');
            if (await contarSalidasReales(lote.id_lote, transaction)) {
                throw new ErrorNegocio(`No se puede anular: del lote ${lote.numero_lote} ya salió producto. Corrige con un ajuste o una baja en el Kárdex.`);
            }
            const antes = instantanea(lote);
            if (Number(lote.cantidad_disponible) > 0) {
                await registrarMovimiento({
                    lote, tipo: 'salida', cantidad: lote.cantidad_disponible, motivo: await obtenerMotivo('ANULACION_LOTE', transaction),
                    id_usuario: req.usuario.id, id_ingreso: lote.id_ingreso, observacion: motivoTexto, transaction
                });
            }
            await lote.update({ condicion: 'anulado', motivo_condicion: motivoTexto }, { transaction });
            await registrarAuditoria({ req, tabla: 'lotes', id_registro: lote.id_lote, accion: 'anular', antes, despues: lote, motivo: motivoTexto, transaction });
        });
        res.json({ mensaje: `Lote ${lote.numero_lote} anulado. Un administrador puede restaurarlo si fue un error.` });
    } catch (error) { manejarError(res, error, 'Error al anular el lote'); }
};

// Revierte la anulación individual: regresa la misma cantidad que se sacó
const restaurarLote = async (req, res) => {
    try {
        const motivoTexto = exigirTexto(req.body?.motivo, 'Indica el motivo de la restauración.');
        let lote;
        await sequelize.transaction(async (transaction) => {
            lote = await Lote.findByPk(req.params.id, { include: [{ model: Ingreso, attributes: ['estado'] }], transaction, lock: { level: transaction.LOCK.UPDATE, of: Lote } });
            if (!lote) throw new ErrorNegocio('Lote no encontrado', 404);
            if (lote.condicion !== 'anulado') throw new ErrorNegocio('El lote no está anulado.');
            if (lote.Ingreso?.estado === 'anulado') throw new ErrorNegocio('Este lote se anuló junto con su factura; restaura el ingreso de compra.');
            const salidaAnulacion = await Movimiento.findOne({
                where: { id_lote: lote.id_lote, tipo_movimiento: 'salida' },
                include: [{ model: MotivoMovimiento, attributes: [], where: { codigo: 'ANULACION_LOTE' } }],
                order: [['fecha_movimiento', 'DESC'], ['id_movimiento', 'DESC']],
                transaction
            });
            const antes = instantanea(lote);
            await lote.update({
                condicion: lote.fecha_vencimiento < hoy() ? 'vencido' : 'disponible',
                motivo_condicion: `Restaurado: ${motivoTexto}`
            }, { transaction });
            if (salidaAnulacion) {
                await registrarMovimiento({
                    lote, tipo: 'entrada', cantidad: salidaAnulacion.cantidad, motivo: await obtenerMotivo('RESTAURACION_LOTE', transaction),
                    id_usuario: req.usuario.id, id_ingreso: lote.id_ingreso, observacion: motivoTexto, transaction
                });
            }
            await registrarAuditoria({ req, tabla: 'lotes', id_registro: lote.id_lote, accion: 'restaurar', antes, despues: lote, motivo: motivoTexto, transaction });
        });
        res.json({ mensaje: `Lote ${lote.numero_lote} restaurado; su existencia regresó al inventario.` });
    } catch (error) { manejarError(res, error, 'Error al restaurar el lote'); }
};

module.exports = {
    getLotes, getLote, getLotesAlerta, updateLote, cambiarCondicion, anularLote, restaurarLote,
    contarSalidasReales, INCLUDE_LOTE, enriquecer
};
