const {
    Institucion, TipoInstitucion, Contrato, ModalidadCompra, Pedido, DetallePedido, Producto,
    AsignacionLote, Lote, Laboratorio
} = require('../models/index');
const { crearControladorCatalogo } = require('./catalogoFactory');
const { manejarError, ErrorNegocio } = require('../utils/errores');

const base = crearControladorCatalogo({
    modelo: Institucion,
    tabla: 'instituciones',
    etiqueta: 'institución',
    campos: ['nombre', 'id_tipo_institucion', 'nit', 'unidad_ejecutora', 'departamento', 'direccion', 'telefono', 'email', 'contacto'],
    include: [{ model: TipoInstitucion, attributes: ['id_tipo_institucion', 'nombre'] }],
    validar: (d) => {
        if (!d.nombre) throw new ErrorNegocio('El nombre de la institución es obligatorio.');
        if (!d.id_tipo_institucion) throw new ErrorNegocio('Selecciona el tipo de institución.');
    }
});

// Qué se le ha vendido a la institución: contratos, pedidos, productos y
// de qué lotes salieron.
const getHistorial = async (req, res) => {
    try {
        const institucion = await Institucion.findByPk(req.params.id, { include: [{ model: TipoInstitucion, attributes: ['nombre'] }] });
        if (!institucion) return res.status(404).json({ mensaje: 'Institución no encontrada' });

        const contratos = await Contrato.findAll({
            where: { id_institucion: institucion.id_institucion },
            include: [{ model: ModalidadCompra, attributes: ['nombre'] }],
            order: [['fecha_inicio', 'DESC']]
        });

        const entregas = await AsignacionLote.findAll({
            include: [
                { model: Lote, attributes: ['id_lote', 'numero_lote', 'fecha_vencimiento'], include: [{ model: Laboratorio, attributes: ['nombre'] }] },
                {
                    model: DetallePedido, required: true, attributes: ['id_detalle_pedido'],
                    include: [
                        { model: Producto, attributes: ['nombre', 'codigo'] },
                        {
                            model: Pedido, required: true, attributes: ['id_pedido', 'numero_pedido', 'estado', 'fecha_programada', 'fecha_real_entrega'],
                            include: [{ model: Contrato, required: true, attributes: ['numero_contrato', 'nog'], where: { id_institucion: institucion.id_institucion } }]
                        }
                    ]
                }
            ],
            order: [['id_asignacion', 'DESC']]
        });

        res.json({
            institucion,
            contratos,
            entregas: entregas
                .filter(a => a.DetallePedido.Pedido.estado !== 'anulado')
                .map(a => ({
                    numero_pedido: a.DetallePedido.Pedido.numero_pedido,
                    id_pedido: a.DetallePedido.Pedido.id_pedido,
                    estado: a.DetallePedido.Pedido.estado,
                    fecha: a.DetallePedido.Pedido.fecha_real_entrega || a.DetallePedido.Pedido.fecha_programada,
                    numero_contrato: a.DetallePedido.Pedido.Contrato.numero_contrato,
                    nog: a.DetallePedido.Pedido.Contrato.nog,
                    producto: a.DetallePedido.Producto.nombre,
                    codigo: a.DetallePedido.Producto.codigo,
                    id_lote: a.Lote.id_lote,
                    numero_lote: a.Lote.numero_lote,
                    laboratorio: a.Lote.Laboratorio?.nombre,
                    fecha_vencimiento: a.Lote.fecha_vencimiento,
                    cantidad: Number(a.cantidad)
                }))
        });
    } catch (error) { manejarError(res, error, 'Error al obtener el historial de la institución'); }
};

module.exports = { ...base, getHistorial };
