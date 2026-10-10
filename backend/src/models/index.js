const Usuario = require('./Usuario');
const Institucion = require('./Institucion');
const Producto = require('./Producto');
const Lote = require('./Lote');
const Movimiento = require('./Movimiento');
const Contrato = require('./Contrato');
const DetalleContrato = require('./DetalleContrato');
const Pedido = require('./Pedido');
const DetallePedido = require('./DetallePedido');

// Producto - Lote
Producto.hasMany(Lote, { foreignKey: 'id_producto' });
Lote.belongsTo(Producto, { foreignKey: 'id_producto' });

// Lote - Movimiento
Lote.hasMany(Movimiento, { foreignKey: 'id_lote' });
Movimiento.belongsTo(Lote, { foreignKey: 'id_lote' });

// Usuario - Movimiento
Usuario.hasMany(Movimiento, { foreignKey: 'id_usuario' });
Movimiento.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// Institucion - Contrato
Institucion.hasMany(Contrato, { foreignKey: 'id_institucion' });
Contrato.belongsTo(Institucion, { foreignKey: 'id_institucion' });

// Usuario - Contrato
Usuario.hasMany(Contrato, { foreignKey: 'id_usuario' });
Contrato.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// Contrato - DetalleContrato
Contrato.hasMany(DetalleContrato, { foreignKey: 'id_contrato' });
DetalleContrato.belongsTo(Contrato, { foreignKey: 'id_contrato' });

// Producto - DetalleContrato
Producto.hasMany(DetalleContrato, { foreignKey: 'id_producto' });
DetalleContrato.belongsTo(Producto, { foreignKey: 'id_producto' });

// Contrato - Pedido
Contrato.hasMany(Pedido, { foreignKey: 'id_contrato' });
Pedido.belongsTo(Contrato, { foreignKey: 'id_contrato' });

// Usuario - Pedido
Usuario.hasMany(Pedido, { foreignKey: 'id_usuario' });
Pedido.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// Pedido - DetallePedido
Pedido.hasMany(DetallePedido, { foreignKey: 'id_pedido' });
DetallePedido.belongsTo(Pedido, { foreignKey: 'id_pedido' });

// Lote - DetallePedido
Lote.hasMany(DetallePedido, { foreignKey: 'id_lote' });
DetallePedido.belongsTo(Lote, { foreignKey: 'id_lote' });

module.exports = {
    Usuario, Institucion, Producto, Lote,
    Movimiento, Contrato, DetalleContrato,
    Pedido, DetallePedido
};