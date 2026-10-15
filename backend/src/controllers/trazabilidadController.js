// Trazabilidad en los dos sentidos:
//   hacia atrás: lote -> laboratorio fabricante, proveedor, factura, fecha de compra
//   hacia adelante: lote -> pedidos, instituciones y contratos que lo recibieron
// Se puede buscar por laboratorio, producto, proveedor, institución, número
// de lote y rango de fechas de compra (ej. "¿qué lidocaína de Bayer le
// vendimos al hospital de Chiquimula?").
const { Op } = require('sequelize');
const {
    Lote, Producto, Laboratorio, Ingreso, Proveedor, Ubicacion, AsignacionLote, DetallePedido, Pedido,
    Contrato, Institucion, SeguimientoPedido, Usuario, Auditoria
} = require('../models/index');
const { manejarError } = require('../utils/errores');
const { obtenerParametros } = require('../services/parametros');
const { INCLUDE_LOTE, enriquecer } = require('./loteController');
const { INCLUDE_MOVIMIENTO } = require('./movimientoController');
const { Movimiento } = require('../models/index');
const { esFechaValida } = require('../utils/fechas');

// Destinos (entregas) de uno o varios lotes, sin pedidos anulados
const buscarDestinos = (where) => AsignacionLote.findAll({
    where,
    include: [{
        model: DetallePedido, required: true, attributes: ['id_detalle_pedido', 'id_producto'],
        include: [{
            model: Pedido, required: true, where: { estado: { [Op.ne]: 'anulado' } },
            attributes: ['id_pedido', 'numero_pedido', 'estado', 'fecha_pedido', 'fecha_programada', 'fecha_real_entrega'],
            include: [{
                model: Contrato, attributes: ['id_contrato', 'numero_contrato', 'nog'],
                include: [{ model: Institucion, attributes: ['id_institucion', 'nombre', 'departamento'] }]
            }]
        }]
    }],
    order: [['id_asignacion', 'ASC']]
});

const aplanarDestino = (a) => ({
    id_lote: a.id_lote,
    cantidad: Number(a.cantidad),
    id_pedido: a.DetallePedido.Pedido.id_pedido,
    numero_pedido: a.DetallePedido.Pedido.numero_pedido,
    estado: a.DetallePedido.Pedido.estado,
    fecha_pedido: a.DetallePedido.Pedido.fecha_pedido,
    fecha_entrega: a.DetallePedido.Pedido.fecha_real_entrega,
    numero_contrato: a.DetallePedido.Pedido.Contrato.numero_contrato,
    nog: a.DetallePedido.Pedido.Contrato.nog,
    id_institucion: a.DetallePedido.Pedido.Contrato.Institucion.id_institucion,
    institucion: a.DetallePedido.Pedido.Contrato.Institucion.nombre,
    departamento: a.DetallePedido.Pedido.Contrato.Institucion.departamento
});

// GET /trazabilidad/buscar?texto&id_laboratorio&id_producto&id_proveedor&id_institucion&numero_lote&desde&hasta
// texto busca a la vez en lote, producto, laboratorio, proveedor, factura e instituciones que lo recibieron
const buscar = async (req, res) => {
    try {
        const parametros = await obtenerParametros();
        const { texto, id_laboratorio, id_producto, id_proveedor, id_institucion, numero_lote, desde, hasta } = req.query;
        const where = {};
        if (id_laboratorio) where.id_laboratorio = id_laboratorio;
        if (id_producto) where.id_producto = id_producto;
        if (numero_lote) where.numero_lote = { [Op.iLike]: `%${String(numero_lote).trim()}%` };
        if (id_proveedor) where['$Ingreso.id_proveedor$'] = id_proveedor;
        if (esFechaValida(desde) || esFechaValida(hasta)) {
            where['$Ingreso.fecha_recepcion$'] = {};
            if (esFechaValida(desde)) where['$Ingreso.fecha_recepcion$'][Op.gte] = desde;
            if (esFechaValida(hasta)) where['$Ingreso.fecha_recepcion$'][Op.lte] = hasta;
        }

        let lotes = await Lote.findAll({ where, include: INCLUDE_LOTE, order: [['fecha_vencimiento', 'ASC']] });
        const destinos = lotes.length ? await buscarDestinos({ id_lote: lotes.map(l => l.id_lote) }) : [];

        const porLote = {};
        destinos.map(aplanarDestino).forEach(d => {
            (porLote[d.id_lote] || (porLote[d.id_lote] = [])).push(d);
        });

        if (id_institucion) lotes = lotes.filter(l => (porLote[l.id_lote] || []).some(d => String(d.id_institucion) === String(id_institucion)));

        const buscado = String(texto || '').trim().toLowerCase();
        res.json(lotes.map(l => {
            const entregas = (porLote[l.id_lote] || []).filter(d => !id_institucion || String(d.id_institucion) === String(id_institucion));
            return {
                ...enriquecer(l, parametros),
                cantidad_despachada: entregas.reduce((s, d) => s + d.cantidad, 0),
                instituciones: [...new Set(entregas.map(d => d.institucion))]
            };
        }).filter(l => !buscado || [
            l.numero_lote, l.Producto?.nombre, l.Producto?.codigo, l.Laboratorio?.nombre, l.Ingreso?.Proveedor?.nombre,
            l.Ingreso && `${l.Ingreso.serie_factura}-${l.Ingreso.numero_factura}`, ...l.instituciones
        ].some(v => v && String(v).toLowerCase().includes(buscado))));
    } catch (error) { manejarError(res, error, 'Error en la búsqueda de trazabilidad'); }
};

// GET /trazabilidad/lote/:id  -> origen, kárdex, destinos, seguimiento y cambios
const detalleLote = async (req, res) => {
    try {
        const parametros = await obtenerParametros();
        const lote = await Lote.findByPk(req.params.id, {
            include: [
                { model: Producto, attributes: ['id_producto', 'nombre', 'codigo', 'concentracion'] },
                { model: Laboratorio, attributes: ['id_laboratorio', 'nombre', 'pais'] },
                { model: Ubicacion, attributes: ['nombre'] },
                {
                    model: Ingreso,
                    include: [{ model: Proveedor, attributes: ['id_proveedor', 'nombre', 'nit', 'telefono', 'contacto'] }, { model: Usuario, attributes: ['nombre', 'apellido'] }]
                }
            ]
        });
        if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado' });

        const [movimientos, destinos, cambios] = await Promise.all([
            Movimiento.findAll({ where: { id_lote: lote.id_lote }, include: INCLUDE_MOVIMIENTO, order: [['fecha_movimiento', 'ASC'], ['id_movimiento', 'ASC']] }),
            buscarDestinos({ id_lote: lote.id_lote }),
            Auditoria.findAll({
                where: { tabla: 'lotes', id_registro: String(lote.id_lote) },
                include: [{ model: Usuario, attributes: ['nombre', 'apellido', 'rol'] }],
                order: [['fecha', 'ASC']]
            })
        ]);

        const idsPedidos = [...new Set(destinos.map(d => d.DetallePedido.Pedido.id_pedido))];
        const seguimiento = idsPedidos.length ? await SeguimientoPedido.findAll({
            where: { id_pedido: idsPedidos },
            include: [{ model: Usuario, attributes: ['nombre', 'apellido'] }],
            order: [['fecha', 'ASC']]
        }) : [];

        res.json({
            lote: enriquecer(lote, parametros),
            movimientos,
            destinos: destinos.map(aplanarDestino).map(d => ({
                ...d,
                seguimiento: seguimiento.filter(s => s.id_pedido === d.id_pedido)
            })),
            cambios
        });
    } catch (error) { manejarError(res, error, 'Error al obtener la trazabilidad del lote'); }
};

module.exports = { buscar, detalleLote };
