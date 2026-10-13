const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Línea del pedido: qué renglón del contrato y cuánto. Los lotes de los que
// sale el producto los decide el sistema (FEFO) y quedan en AsignacionLote.
const DetallePedido = sequelize.define('DetallePedido', {
    id_detalle_pedido: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_pedido: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_detalle_contrato: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_producto: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    precio_unitario: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    }
}, {
    tableName: 'detalle_pedidos',
    timestamps: true
});

module.exports = DetallePedido;
