const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Movimiento = sequelize.define('Movimiento', {
    id_movimiento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_lote: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipo_movimiento: {
        type: DataTypes.ENUM('entrada', 'salida'),
        allowNull: false
    },
    entrada: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    salida: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    saldo: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    fecha_movimiento: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    motivo: {
        type: DataTypes.TEXT
    },
    observacion: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'movimientos',
    timestamps: true
});

module.exports = Movimiento;