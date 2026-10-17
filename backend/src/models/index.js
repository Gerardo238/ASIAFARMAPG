const Usuario = require('./Usuario');
const Institucion = require('./Institucion');
const Producto = require('./Producto');
const Ingreso = require('./Ingreso');
const Lote = require('./Lote');
const Movimiento = require('./Movimiento');
const Contrato = require('./Contrato');
const DetalleContrato = require('./DetalleContrato');
const Pedido = require('./Pedido');
const DetallePedido = require('./DetallePedido');
const Auditoria = require('./Auditoria');
const Adjunto = require('./Adjunto');
const { AsignacionLote, SeguimientoPedido } = require('./Despacho');
const TramiteContrato = require('./TramiteContrato');
const { DevolucionPedido, DetalleDevolucion } = require('./Devolucion');
const {
    Ubicacion, FormaFarmaceutica, UnidadMedida, TipoInstitucion, ModalidadCompra,
    MotivoMovimiento, Laboratorio, Proveedor, Parametro
} = require('./Catalogos');

// ---------- Catálogos de producto ----------
FormaFarmaceutica.hasMany(Producto, { foreignKey: 'id_forma_farmaceutica' });
Producto.belongsTo(FormaFarmaceutica, { foreignKey: 'id_forma_farmaceutica' });
UnidadMedida.hasMany(Producto, { foreignKey: 'id_unidad_medida' });
Producto.belongsTo(UnidadMedida, { foreignKey: 'id_unidad_medida' });

// ---------- Compras: Proveedor - Ingreso - Lote ----------
Proveedor.hasMany(Ingreso, { foreignKey: 'id_proveedor' });
Ingreso.belongsTo(Proveedor, { foreignKey: 'id_proveedor' });
Usuario.hasMany(Ingreso, { foreignKey: 'id_usuario' });
Ingreso.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Ingreso.hasMany(Lote, { foreignKey: 'id_ingreso' });
Lote.belongsTo(Ingreso, { foreignKey: 'id_ingreso' });

// ---------- Lote ----------
Producto.hasMany(Lote, { foreignKey: 'id_producto' });
Lote.belongsTo(Producto, { foreignKey: 'id_producto' });
Laboratorio.hasMany(Lote, { foreignKey: 'id_laboratorio' });
Lote.belongsTo(Laboratorio, { foreignKey: 'id_laboratorio' });
Ubicacion.hasMany(Lote, { foreignKey: 'id_ubicacion' });
Lote.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion' });

// ---------- Kárdex ----------
Lote.hasMany(Movimiento, { foreignKey: 'id_lote' });
Movimiento.belongsTo(Lote, { foreignKey: 'id_lote' });
Usuario.hasMany(Movimiento, { foreignKey: 'id_usuario' });
Movimiento.belongsTo(Usuario, { foreignKey: 'id_usuario' });
MotivoMovimiento.hasMany(Movimiento, { foreignKey: 'id_motivo' });
Movimiento.belongsTo(MotivoMovimiento, { foreignKey: 'id_motivo' });
Ingreso.hasMany(Movimiento, { foreignKey: 'id_ingreso' });
Movimiento.belongsTo(Ingreso, { foreignKey: 'id_ingreso' });
Pedido.hasMany(Movimiento, { foreignKey: 'id_pedido' });
Movimiento.belongsTo(Pedido, { foreignKey: 'id_pedido' });

// ---------- Ventas: Institución - Contrato ----------
TipoInstitucion.hasMany(Institucion, { foreignKey: 'id_tipo_institucion' });
Institucion.belongsTo(TipoInstitucion, { foreignKey: 'id_tipo_institucion' });
Institucion.hasMany(Contrato, { foreignKey: 'id_institucion' });
Contrato.belongsTo(Institucion, { foreignKey: 'id_institucion' });
ModalidadCompra.hasMany(Contrato, { foreignKey: 'id_modalidad' });
Contrato.belongsTo(ModalidadCompra, { foreignKey: 'id_modalidad' });
Usuario.hasMany(Contrato, { foreignKey: 'id_usuario' });
Contrato.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Contrato.hasMany(DetalleContrato, { foreignKey: 'id_contrato' });
DetalleContrato.belongsTo(Contrato, { foreignKey: 'id_contrato' });
Producto.hasMany(DetalleContrato, { foreignKey: 'id_producto' });
DetalleContrato.belongsTo(Producto, { foreignKey: 'id_producto' });

// ---------- Contrato - Pedido - Despacho ----------
Contrato.hasMany(Pedido, { foreignKey: 'id_contrato' });
Pedido.belongsTo(Contrato, { foreignKey: 'id_contrato' });
Usuario.hasMany(Pedido, { foreignKey: 'id_usuario' });
Pedido.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Pedido.hasMany(DetallePedido, { foreignKey: 'id_pedido' });
DetallePedido.belongsTo(Pedido, { foreignKey: 'id_pedido' });
DetalleContrato.hasMany(DetallePedido, { foreignKey: 'id_detalle_contrato' });
DetallePedido.belongsTo(DetalleContrato, { foreignKey: 'id_detalle_contrato' });
Producto.hasMany(DetallePedido, { foreignKey: 'id_producto' });
DetallePedido.belongsTo(Producto, { foreignKey: 'id_producto' });
DetallePedido.hasMany(AsignacionLote, { foreignKey: 'id_detalle_pedido' });
AsignacionLote.belongsTo(DetallePedido, { foreignKey: 'id_detalle_pedido' });
Lote.hasMany(AsignacionLote, { foreignKey: 'id_lote' });
AsignacionLote.belongsTo(Lote, { foreignKey: 'id_lote' });
Pedido.hasMany(SeguimientoPedido, { foreignKey: 'id_pedido' });
SeguimientoPedido.belongsTo(Pedido, { foreignKey: 'id_pedido' });
Usuario.hasMany(SeguimientoPedido, { foreignKey: 'id_usuario' });
SeguimientoPedido.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// ---------- Trámites del contrato (prórrogas, notas técnicas, oficios) ----------
Contrato.hasMany(TramiteContrato, { foreignKey: 'id_contrato' });
TramiteContrato.belongsTo(Contrato, { foreignKey: 'id_contrato' });
DetalleContrato.hasMany(TramiteContrato, { foreignKey: 'id_detalle_contrato' });
TramiteContrato.belongsTo(DetalleContrato, { foreignKey: 'id_detalle_contrato' });
Pedido.hasMany(TramiteContrato, { foreignKey: 'id_pedido' });
TramiteContrato.belongsTo(Pedido, { foreignKey: 'id_pedido' });
Usuario.hasMany(TramiteContrato, { foreignKey: 'id_usuario' });
TramiteContrato.belongsTo(Usuario, { foreignKey: 'id_usuario' });
TramiteContrato.belongsTo(Usuario, { foreignKey: 'id_usuario_resolucion', as: 'Resolvio' });

// ---------- Devoluciones de instituciones ----------
Pedido.hasMany(DevolucionPedido, { foreignKey: 'id_pedido' });
DevolucionPedido.belongsTo(Pedido, { foreignKey: 'id_pedido' });
Usuario.hasMany(DevolucionPedido, { foreignKey: 'id_usuario' });
DevolucionPedido.belongsTo(Usuario, { foreignKey: 'id_usuario' });
DevolucionPedido.hasMany(DetalleDevolucion, { foreignKey: 'id_devolucion' });
DetalleDevolucion.belongsTo(DevolucionPedido, { foreignKey: 'id_devolucion' });
AsignacionLote.hasMany(DetalleDevolucion, { foreignKey: 'id_asignacion' });
DetalleDevolucion.belongsTo(AsignacionLote, { foreignKey: 'id_asignacion' });
DetallePedido.hasMany(DetalleDevolucion, { foreignKey: 'id_detalle_pedido' });
DetalleDevolucion.belongsTo(DetallePedido, { foreignKey: 'id_detalle_pedido' });
Lote.hasMany(DetalleDevolucion, { foreignKey: 'id_lote' });
DetalleDevolucion.belongsTo(Lote, { foreignKey: 'id_lote' });

// ---------- Auditoría ----------
Usuario.hasMany(Auditoria, { foreignKey: 'id_usuario' });
Auditoria.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Usuario.hasMany(Adjunto, { foreignKey: 'id_usuario' });
Adjunto.belongsTo(Usuario, { foreignKey: 'id_usuario' });

module.exports = {
    Usuario, Institucion, Producto, Ingreso, Lote, Movimiento,
    Contrato, DetalleContrato, Pedido, DetallePedido, AsignacionLote, SeguimientoPedido,
    TramiteContrato, DevolucionPedido, DetalleDevolucion, Auditoria, Adjunto, Ubicacion, FormaFarmaceutica, UnidadMedida, TipoInstitucion, ModalidadCompra,
    MotivoMovimiento, Laboratorio, Proveedor, Parametro
};
