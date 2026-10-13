// Kárdex. Las entradas por compra y las salidas por despacho las genera el
// sistema; aquí solo se registran ajustes manuales (merma, destrucción,
// devolución, conteo físico...), siempre con motivo de catálogo y observación.
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Movimiento, Lote, Usuario, Producto, MotivoMovimiento, Pedido, Ingreso, Contrato, Institucion } = require('../models/index');
const { manejarError, ErrorNegocio, exigirTexto, exigirCantidad } = require('../utils/errores');
const { registrarMovimiento } = require('../services/inventario');
const { registrarAuditoria, instantanea } = require('../utils/auditoria');
const { esFechaValida } = require('../utils/fechas');

const INCLUDE_MOVIMIENTO = [
    { model: Lote, attributes: ['id_lote', 'numero_lote', 'id_producto'], include: [{ model: Producto, attributes: ['id_producto', 'nombre', 'codigo'] }] },
    { model: Usuario, attributes: ['nombre', 'apellido'] },
    { model: MotivoMovimiento, attributes: ['nombre', 'codigo'] },
    { model: Ingreso, attributes: ['id_ingreso', 'serie_factura', 'numero_factura'] },
    {
        model: Pedido, attributes: ['id_pedido', 'numero_pedido'],
        include: [{ model: Contrato, attributes: ['numero_contrato'], include: [{ model: Institucion, attributes: ['nombre'] }] }]
    }
];

// Filtros: id_producto, id_lote, tipo, id_motivo, desde, hasta (fecha del movimiento)
const getMovimientos = async (req, res) => {
    try {
        const { id_producto, id_lote, tipo, id_motivo, desde, hasta } = req.query;
        const where = {};
        if (id_lote) where.id_lote = id_lote;
        if (tipo) where.tipo_movimiento = tipo;
        if (id_motivo) where.id_motivo = id_motivo;
        if (id_producto) where['$Lote.id_producto$'] = id_producto;
        if (esFechaValida(desde) || esFechaValida(hasta)) {
            where.fecha_movimiento = {};
            if (esFechaValida(desde)) where.fecha_movimiento[Op.gte] = new Date(`${desde}T00:00:00-06:00`);
            if (esFechaValida(hasta)) where.fecha_movimiento[Op.lte] = new Date(`${hasta}T23:59:59-06:00`);
        }
        const movimientos = await Movimiento.findAll({
            where, include: INCLUDE_MOVIMIENTO,
            order: [['fecha_movimiento', 'DESC'], ['id_movimiento', 'DESC']],
            limit: 1000
        });
        res.json(movimientos);
    } catch (error) { manejarError(res, error, 'Error al obtener movimientos'); }
};

const getMovimientosPorLote = async (req, res) => {
    try {
        const movimientos = await Movimiento.findAll({
            where: { id_lote: req.params.id_lote },
            include: INCLUDE_MOVIMIENTO,
            order: [['fecha_movimiento', 'ASC'], ['id_movimiento', 'ASC']]
        });
        res.json(movimientos);
    } catch (error) { manejarError(res, error, 'Error al obtener movimientos'); }
};

const createAjuste = async (req, res) => {
    try {
        const { id_lote, id_motivo } = req.body;
        const cantidad = exigirCantidad(req.body.cantidad);
        const observacion = exigirTexto(req.body.observacion, 'Describe el motivo del ajuste en la observación.');

        const motivo = await MotivoMovimiento.findByPk(id_motivo);
        if (!motivo || !motivo.activo) throw new ErrorNegocio('Selecciona un motivo válido.');
        if (motivo.sistema) throw new ErrorNegocio('Ese motivo lo usa el sistema; las compras se registran en Ingresos y las salidas por venta en Pedidos.');

        const movimiento = await sequelize.transaction(async (transaction) => {
            const lote = await Lote.findByPk(id_lote, { transaction, lock: transaction.LOCK.UPDATE });
            if (!lote) throw new ErrorNegocio('Lote no encontrado', 404);
            if (lote.condicion === 'anulado') throw new ErrorNegocio('El lote pertenece a un ingreso anulado.');
            const antes = instantanea(lote);
            const mov = await registrarMovimiento({
                lote, tipo: motivo.tipo, cantidad, motivo, id_usuario: req.usuario.id, observacion, transaction
            });
            await registrarAuditoria({ req, tabla: 'lotes', id_registro: lote.id_lote, accion: 'ajuste_inventario', antes, despues: lote, motivo: `${motivo.nombre}: ${observacion}`, transaction });
            return mov;
        });
        res.status(201).json({ mensaje: 'Ajuste registrado', movimiento });
    } catch (error) { manejarError(res, error, 'Error al registrar el ajuste'); }
};

module.exports = { getMovimientos, getMovimientosPorLote, createAjuste, INCLUDE_MOVIMIENTO };
