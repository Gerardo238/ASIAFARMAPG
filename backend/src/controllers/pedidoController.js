// Pedidos de una institución bajo un contrato. Flujo:
//   pendiente -> en_preparacion (el sistema asigna lotes por FEFO y descuenta
//   inventario) -> empacado -> en_transporte -> entregado
// Cada cambio de etapa queda en el seguimiento con usuario y fecha.
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
    Pedido, Contrato, Institucion, Usuario, DetallePedido, DetalleContrato, Producto, Lote, Laboratorio,
    AsignacionLote, SeguimientoPedido, UnidadMedida
} = require('../models/index');
const { manejarError, ErrorNegocio, exigirTexto, exigirCantidad } = require('../utils/errores');
const { registrarAuditoria, instantanea } = require('../utils/auditoria');
const { proponerFEFO, registrarMovimiento, obtenerMotivo, redondear } = require('../services/inventario');
const { calcularAvance, verificarContratoCompletado, vigenciaDelContrato } = require('./contratoController');
const { calcularRetraso, esEntregaProxima } = require('../services/analisis');
const { obtenerParametro } = require('../services/parametros');
const { hoy, esFechaValida, diasEntre } = require('../utils/fechas');

const ETIQUETAS = {
    pendiente: 'Pendiente', en_preparacion: 'En preparación', empacado: 'Empacado',
    en_transporte: 'En transporte', entregado: 'Entregado', anulado: 'Anulado'
};

const INCLUDE_CONTRATO = {
    model: Contrato,
    attributes: ['id_contrato', 'numero_contrato', 'nog', 'estado', 'vigencia_minima_meses', 'fecha_fin'],
    include: [{ model: Institucion, attributes: ['id_institucion', 'nombre', 'departamento'] }]
};

// Agrega retraso y la alerta preventiva de entrega (diasAlerta = parámetro DIAS_ALERTA_PEDIDO)
const conRetraso = (pedido, diasAlerta) => {
    const datos = typeof pedido.get === 'function' ? pedido.get({ plain: true }) : pedido;
    const dias_retraso = calcularRetraso(datos);
    return {
        ...datos, dias_retraso, retrasado: dias_retraso > 0,
        dias_para_entrega: diasEntre(hoy(), datos.fecha_programada),
        entrega_proxima: esEntregaProxima(datos, diasAlerta)
    };
};

// Filtros: estado, id_contrato, id_institucion, retrasados=1, proximos=1
const getPedidos = async (req, res) => {
    try {
        const { estado, id_contrato, id_institucion, retrasados, proximos } = req.query;
        const diasAlerta = await obtenerParametro('DIAS_ALERTA_PEDIDO');
        const where = {};
        if (estado) where.estado = estado;
        if (id_contrato) where.id_contrato = id_contrato;
        if (id_institucion) where['$Contrato.id_institucion$'] = id_institucion;
        const pedidos = await Pedido.findAll({
            where,
            include: [INCLUDE_CONTRATO, { model: Usuario, attributes: ['nombre', 'apellido'] }],
            order: [['fecha_programada', 'DESC'], ['id_pedido', 'DESC']]
        });
        let lista = pedidos.map(p => conRetraso(p, diasAlerta));
        if (retrasados) lista = lista.filter(p => p.retrasado && p.estado !== 'entregado');
        if (proximos) lista = lista.filter(p => p.entrega_proxima);
        res.json(lista);
    } catch (error) { manejarError(res, error, 'Error al obtener pedidos'); }
};

const cargarPedido = (id, transaction) => Pedido.findByPk(id, {
    include: [
        INCLUDE_CONTRATO,
        { model: Usuario, attributes: ['nombre', 'apellido'] },
        {
            model: DetallePedido,
            include: [
                { model: Producto, attributes: ['id_producto', 'nombre', 'codigo', 'concentracion'], include: [{ model: UnidadMedida, attributes: ['nombre'] }] },
                { model: DetalleContrato, attributes: ['numero_renglon'] },
                {
                    model: AsignacionLote,
                    include: [{ model: Lote, attributes: ['id_lote', 'numero_lote', 'fecha_vencimiento', 'condicion'], include: [{ model: Laboratorio, attributes: ['nombre'] }] }]
                }
            ]
        },
        { model: SeguimientoPedido, include: [{ model: Usuario, attributes: ['nombre', 'apellido'] }] }
    ],
    order: [[SeguimientoPedido, 'fecha', 'ASC'], [DetallePedido, 'id_detalle_pedido', 'ASC']],
    transaction
});

const getPedido = async (req, res) => {
    try {
        const pedido = await cargarPedido(req.params.id);
        if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        res.json(conRetraso(pedido, await obtenerParametro('DIAS_ALERTA_PEDIDO')));
    } catch (error) { manejarError(res, error, 'Error al obtener pedido'); }
};

const registrarSeguimiento = (pedido, estado, req, observacion, transaction) =>
    SeguimientoPedido.create({ id_pedido: pedido.id_pedido, estado, id_usuario: req.usuario.id, observacion: observacion || null, fecha: new Date() }, { transaction });

// Body: { id_contrato, fecha_programada, observaciones, detalles: [{ id_detalle_contrato, cantidad }] }
const createPedido = async (req, res) => {
    try {
        const { id_contrato, fecha_programada, observaciones, detalles } = req.body;
        const fechaHoy = hoy();
        if (!esFechaValida(fecha_programada) || fecha_programada < fechaHoy) throw new ErrorNegocio('La fecha programada de entrega es obligatoria y no puede ser pasada.');
        if (!Array.isArray(detalles) || detalles.filter(d => Number(d.cantidad) > 0).length === 0) {
            throw new ErrorNegocio('Indica la cantidad de al menos un renglón del contrato.');
        }

        const pedido = await sequelize.transaction(async (transaction) => {
            const contrato = await Contrato.findByPk(id_contrato, {
                include: [{ model: DetalleContrato, include: [{ model: Producto, attributes: ['nombre'] }] }],
                transaction, lock: { level: transaction.LOCK.UPDATE, of: Contrato }
            });
            if (!contrato) throw new ErrorNegocio('Contrato no encontrado.', 404);
            if (contrato.estado !== 'vigente') throw new ErrorNegocio(`El contrato está ${contrato.estado}; solo se pueden hacer pedidos de contratos vigentes.`);
            if (fechaHoy < contrato.fecha_inicio) throw new ErrorNegocio('El contrato todavía no ha iniciado.');
            if (fecha_programada > contrato.fecha_fin) throw new ErrorNegocio('La fecha programada no puede ser posterior al fin del contrato.');

            const avance = await calcularAvance(contrato.DetalleContratos.map(r => r.id_detalle_contrato), transaction);
            const lineas = [];
            for (const d of detalles.filter(x => Number(x.cantidad) > 0)) {
                const renglon = contrato.DetalleContratos.find(r => String(r.id_detalle_contrato) === String(d.id_detalle_contrato) && r.activo);
                if (!renglon) throw new ErrorNegocio('Uno de los renglones no pertenece a este contrato.');
                const cantidad = exigirCantidad(d.cantidad);
                const saldo = redondear(Number(renglon.cantidad_contratada) - (avance[renglon.id_detalle_contrato]?.pedida || 0));
                if (cantidad > saldo) {
                    throw new ErrorNegocio(`Renglón ${renglon.numero_renglon} (${renglon.Producto.nombre}): el saldo por pedir es ${saldo}, no se pueden pedir ${cantidad}.`);
                }
                lineas.push({ renglon, cantidad });
            }

            const ultimo = await Pedido.max('id_pedido', { transaction }) || 0;
            const numero = `PED-${fechaHoy.slice(0, 4)}-${String(ultimo + 1).padStart(5, '0')}`;
            const nuevo = await Pedido.create({
                id_contrato, id_usuario: req.usuario.id, numero_pedido: numero, fecha_pedido: fechaHoy,
                fecha_programada, observaciones: observaciones || null, estado: 'pendiente',
                monto_total: redondear(lineas.reduce((s, l) => s + l.cantidad * Number(l.renglon.precio_unitario), 0))
            }, { transaction });
            for (const l of lineas) {
                await DetallePedido.create({
                    id_pedido: nuevo.id_pedido,
                    id_detalle_contrato: l.renglon.id_detalle_contrato,
                    id_producto: l.renglon.id_producto,
                    cantidad: l.cantidad,
                    precio_unitario: l.renglon.precio_unitario,
                    subtotal: redondear(l.cantidad * Number(l.renglon.precio_unitario))
                }, { transaction });
            }
            await registrarSeguimiento(nuevo, 'pendiente', req, 'Pedido registrado', transaction);
            await registrarAuditoria({ req, tabla: 'pedidos', id_registro: nuevo.id_pedido, accion: 'crear', despues: await cargarPedido(nuevo.id_pedido, transaction), transaction });
            return nuevo;
        });
        res.status(201).json({ mensaje: `Pedido ${pedido.numero_pedido} creado`, pedido });
    } catch (error) { manejarError(res, error, 'Error al crear pedido'); }
};

// Solo mientras está pendiente: fecha programada y observaciones
const updatePedido = async (req, res) => {
    try {
        const pedido = await Pedido.findByPk(req.params.id, { include: [INCLUDE_CONTRATO] });
        if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        if (pedido.estado !== 'pendiente') throw new ErrorNegocio('Solo se puede editar un pedido pendiente.');
        const datos = {};
        if (req.body.fecha_programada !== undefined) {
            if (!esFechaValida(req.body.fecha_programada)) throw new ErrorNegocio('Fecha programada no válida.');
            if (req.body.fecha_programada > pedido.Contrato.fecha_fin) throw new ErrorNegocio('La fecha programada no puede ser posterior al fin del contrato.');
            datos.fecha_programada = req.body.fecha_programada;
        }
        if (req.body.observaciones !== undefined) datos.observaciones = req.body.observaciones;
        const motivo = datos.fecha_programada && datos.fecha_programada !== pedido.fecha_programada
            ? exigirTexto(req.body.motivo, 'Indica el motivo del cambio de fecha programada.')
            : req.body.motivo;
        const antes = instantanea(pedido);
        await pedido.update(datos);
        await registrarAuditoria({ req, tabla: 'pedidos', id_registro: pedido.id_pedido, accion: 'editar', antes, despues: pedido, motivo });
        res.json({ mensaje: 'Pedido actualizado', pedido });
    } catch (error) { manejarError(res, error, 'Error al actualizar pedido'); }
};

// Vista previa de los lotes que el sistema tomaría (FEFO), sin descontar nada
const getPropuestaFEFO = async (req, res) => {
    try {
        const pedido = await cargarPedido(req.params.id);
        if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        const vigencia = await vigenciaDelContrato(pedido.Contrato);
        const lineas = [];
        for (const d of pedido.DetallePedidos) {
            const propuesta = await proponerFEFO({ id_producto: d.id_producto, cantidad: d.cantidad, vigenciaMinimaMeses: vigencia });
            lineas.push({
                id_detalle_pedido: d.id_detalle_pedido,
                producto: d.Producto.nombre,
                codigo: d.Producto.codigo,
                cantidad: Number(d.cantidad),
                asignaciones: propuesta.asignaciones.map(({ lote, ...a }) => a),
                faltante: propuesta.faltante,
                excluidos: propuesta.excluidos
            });
        }
        res.json({ vigencia_minima_meses: vigencia, completo: lineas.every(l => l.faltante === 0), lineas });
    } catch (error) { manejarError(res, error, 'Error al calcular la propuesta de despacho'); }
};

// Confirma la preparación: asigna lotes por FEFO y descuenta el inventario.
// Si no alcanza la existencia apta para algún producto no se despacha nada.
const prepararPedido = async (req, res) => {
    try {
        await sequelize.transaction(async (transaction) => {
            const pedido = await Pedido.findByPk(req.params.id, {
                include: [INCLUDE_CONTRATO, { model: DetallePedido, include: [{ model: Producto, attributes: ['nombre'] }] }],
                transaction, lock: { level: transaction.LOCK.UPDATE, of: Pedido }
            });
            if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
            if (pedido.estado !== 'pendiente') throw new ErrorNegocio('Solo se puede preparar un pedido pendiente.');
            if (pedido.Contrato.estado !== 'vigente') throw new ErrorNegocio(`El contrato está ${pedido.Contrato.estado}; no se puede despachar.`);

            const vigencia = await vigenciaDelContrato(pedido.Contrato);
            const motivo = await obtenerMotivo('DESPACHO', transaction);
            const faltantes = [];
            const planes = [];
            for (const d of pedido.DetallePedidos) {
                const plan = await proponerFEFO({ id_producto: d.id_producto, cantidad: d.cantidad, vigenciaMinimaMeses: vigencia, transaction, bloquear: true });
                if (plan.faltante > 0) faltantes.push(`${d.Producto.nombre}: faltan ${plan.faltante} con al menos ${vigencia} meses de vida útil`);
                planes.push({ detalle: d, plan });
            }
            if (faltantes.length) throw new ErrorNegocio('No hay existencia apta suficiente para despachar el pedido completo.', 409, faltantes);

            for (const { detalle, plan } of planes) {
                for (const a of plan.asignaciones) {
                    await AsignacionLote.create({ id_detalle_pedido: detalle.id_detalle_pedido, id_lote: a.id_lote, cantidad: a.cantidad }, { transaction });
                    await registrarMovimiento({
                        lote: a.lote, tipo: 'salida', cantidad: a.cantidad, motivo, id_usuario: req.usuario.id,
                        id_pedido: pedido.id_pedido,
                        observacion: `${pedido.numero_pedido} · ${pedido.Contrato.Institucion.nombre} · Contrato ${pedido.Contrato.numero_contrato}`,
                        transaction
                    });
                }
            }
            const antes = instantanea(pedido);
            await pedido.update({ estado: 'en_preparacion' }, { transaction });
            await registrarSeguimiento(pedido, 'en_preparacion', req, req.body?.observacion || 'Lotes asignados por FEFO', transaction);
            await registrarAuditoria({ req, tabla: 'pedidos', id_registro: pedido.id_pedido, accion: 'cambio_estado', antes, despues: pedido, motivo: 'Preparación del despacho (FEFO)', transaction });
        });
        res.json({ mensaje: 'Pedido en preparación. Los lotes se asignaron automáticamente por fecha de vencimiento.' });
    } catch (error) { manejarError(res, error, 'Error al preparar el pedido'); }
};

// en_preparacion -> empacado -> en_transporte -> entregado
const avanzarPedido = async (req, res) => {
    try {
        let mensaje;
        await sequelize.transaction(async (transaction) => {
            const pedido = await Pedido.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
            if (pedido.estado === 'pendiente') throw new ErrorNegocio('Primero prepara el pedido para asignar los lotes.');
            const siguiente = Pedido.SIGUIENTE_ESTADO[pedido.estado];
            if (!siguiente) throw new ErrorNegocio(`Un pedido ${ETIQUETAS[pedido.estado].toLowerCase()} no puede avanzar.`);
            // El encargado de contratos confirma la entrega con la institución; el empaque y el envío son de bodega
            if (req.usuario.rol === 'encargado_contratos' && siguiente !== 'entregado') {
                throw new ErrorNegocio('Bodega es quien marca el pedido como empacado o en transporte.', 403);
            }

            const cambios = { estado: siguiente };
            if (siguiente === 'entregado') {
                const fecha = req.body?.fecha_entrega || hoy();
                if (!esFechaValida(fecha) || fecha > hoy() || fecha < pedido.fecha_pedido) {
                    throw new ErrorNegocio('La fecha de entrega no puede ser futura ni anterior a la fecha del pedido.');
                }
                cambios.fecha_real_entrega = fecha;
            }
            const antes = instantanea(pedido);
            await pedido.update(cambios, { transaction });
            await registrarSeguimiento(pedido, siguiente, req, req.body?.observacion, transaction);
            await registrarAuditoria({ req, tabla: 'pedidos', id_registro: pedido.id_pedido, accion: 'cambio_estado', antes, despues: pedido, motivo: req.body?.observacion, transaction });
            if (siguiente === 'entregado') await verificarContratoCompletado(pedido.id_contrato, req, transaction);
            mensaje = `Pedido ${pedido.numero_pedido}: ${ETIQUETAS[siguiente]}`;
        });
        res.json({ mensaje });
    } catch (error) { manejarError(res, error, 'Error al actualizar el estado del pedido'); }
};

// Caso 4, "si falta mercadería": reduce cada renglón del pedido pendiente a
// la existencia apta para el contrato. Lo que no se despacha vuelve al saldo
// del contrato y se puede pedir después. Nunca se descuenta lo que no existe.
const ajustarPedido = async (req, res) => {
    try {
        const motivo = exigirTexto(req.body?.motivo, 'Indica el motivo del ajuste (por ejemplo, la institución acepta una entrega parcial).');
        let mensaje;
        await sequelize.transaction(async (transaction) => {
            const pedido = await Pedido.findByPk(req.params.id, {
                include: [INCLUDE_CONTRATO, { model: DetallePedido, include: [{ model: Producto, attributes: ['nombre'] }] }],
                transaction, lock: { level: transaction.LOCK.UPDATE, of: Pedido }
            });
            if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
            if (pedido.estado !== 'pendiente') throw new ErrorNegocio('Solo se puede ajustar un pedido pendiente.');
            const antes = await cargarPedido(pedido.id_pedido, transaction);
            const vigencia = await vigenciaDelContrato(pedido.Contrato);

            const cambios = [];
            for (const d of pedido.DetallePedidos) {
                const { faltante } = await proponerFEFO({ id_producto: d.id_producto, cantidad: d.cantidad, vigenciaMinimaMeses: vigencia, transaction });
                if (faltante > 0) cambios.push({ d, apta: redondear(Number(d.cantidad) - faltante), faltante });
            }
            if (!cambios.length) throw new ErrorNegocio('El pedido ya está cubierto con la existencia apta; no hace falta ajustarlo.');
            const quedaAlgo = pedido.DetallePedidos.some(d => {
                const cambio = cambios.find(x => x.d === d);
                return cambio ? cambio.apta > 0 : Number(d.cantidad) > 0;
            });
            if (!quedaAlgo) throw new ErrorNegocio('No hay existencia apta de ningún producto del pedido. Espera un ingreso de compra o anula el pedido.');

            // El renglón sin existencia apta queda en cero (no se borra) para que se vea qué se pidió
            for (const { d, apta } of cambios) {
                await d.update({ cantidad: apta, subtotal: redondear(apta * Number(d.precio_unitario)) }, { transaction });
            }
            const monto = redondear(pedido.DetallePedidos.reduce((s, d) => s + Number(d.subtotal), 0));
            await pedido.update({ monto_total: monto }, { transaction });
            const detalle = cambios.map(x => `${x.d.Producto.nombre}: -${x.faltante}`).join('; ');
            await registrarSeguimiento(pedido, 'pendiente', req, `Ajustado a existencia apta (${detalle}). ${motivo}`, transaction);
            await registrarAuditoria({ req, tabla: 'pedidos', id_registro: pedido.id_pedido, accion: 'editar', antes, despues: await cargarPedido(pedido.id_pedido, transaction), motivo: `Ajuste a existencia apta: ${motivo}`, transaction });
            mensaje = `Pedido ajustado (${detalle}). Lo que no se despacha regresó al saldo del contrato.`;
        });
        res.json({ mensaje });
    } catch (error) { manejarError(res, error, 'Error al ajustar el pedido'); }
};

// Anula el pedido; si ya tenía lotes asignados, la existencia regresa a esos lotes
const anularPedido = async (req, res) => {
    try {
        const motivoTexto = exigirTexto(req.body?.motivo, 'Indica el motivo de la anulación.');
        await sequelize.transaction(async (transaction) => {
            const pedido = await Pedido.findByPk(req.params.id, {
                include: [{ model: DetallePedido, include: [AsignacionLote] }],
                transaction, lock: { level: transaction.LOCK.UPDATE, of: Pedido }
            });
            if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
            if (['entregado', 'anulado'].includes(pedido.estado)) throw new ErrorNegocio(`Un pedido ${pedido.estado} no se puede anular.`);

            const asignaciones = pedido.DetallePedidos.flatMap(d => d.AsignacionLotes);
            if (asignaciones.length) {
                const motivo = await obtenerMotivo('ANULACION_PEDIDO', transaction);
                for (const a of asignaciones) {
                    const lote = await Lote.findByPk(a.id_lote, { transaction, lock: transaction.LOCK.UPDATE });
                    await registrarMovimiento({
                        lote, tipo: 'entrada', cantidad: a.cantidad, motivo, id_usuario: req.usuario.id,
                        id_pedido: pedido.id_pedido, observacion: `${pedido.numero_pedido}: ${motivoTexto}`, transaction
                    });
                }
            }
            const antes = instantanea(pedido);
            await pedido.update({ estado: 'anulado' }, { transaction });
            await registrarSeguimiento(pedido, 'anulado', req, motivoTexto, transaction);
            await registrarAuditoria({ req, tabla: 'pedidos', id_registro: pedido.id_pedido, accion: 'anular', antes, despues: pedido, motivo: motivoTexto, transaction });
        });
        res.json({ mensaje: 'Pedido anulado. Si tenía lotes asignados, la existencia regresó al inventario.' });
    } catch (error) { manejarError(res, error, 'Error al anular el pedido'); }
};

module.exports = {
    getPedidos, getPedido, createPedido, updatePedido, getPropuestaFEFO, prepararPedido,
    avanzarPedido, ajustarPedido, anularPedido, calcularRetraso, ETIQUETAS
};
