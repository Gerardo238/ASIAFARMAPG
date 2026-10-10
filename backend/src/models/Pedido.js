const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pedido = sequelize.define('Pedido', {
    id_pedido: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_contrato: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    numero_pedido: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    fecha_pedido: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    fecha_programada: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_real_entrega: {
        type: DataTypes.DATE
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'en_proceso', 'despachado', 'entregado', 'retrasado'),
        defaultValue: 'pendiente'
    },
    monto_total: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    observaciones: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'pedidos',
    timestamps: true
});

module.exports = Pedido;