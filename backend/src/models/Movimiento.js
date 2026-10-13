const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Kárdex: cada entrada o salida de un lote. Nunca se edita ni se borra; un
// error se corrige con otro movimiento. Cada movimiento indica su origen
// (ingreso de compra o pedido) para no perder la trazabilidad.
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
        type: DataTypes.INTEGER
    },
    tipo_movimiento: {
        type: DataTypes.ENUM('entrada', 'salida'),
        allowNull: false
    },
    id_motivo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
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
    id_ingreso: {
        type: DataTypes.INTEGER
    },
    id_pedido: {
        type: DataTypes.INTEGER
    },
    observacion: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'movimientos',
    timestamps: true
});

module.exports = Movimiento;
