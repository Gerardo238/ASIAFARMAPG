const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    id_lote: {
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
    descuento: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
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