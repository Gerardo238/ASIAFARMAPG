const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetalleContrato = sequelize.define('DetalleContrato', {
    id_detalle_contrato: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_contrato: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_producto: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cantidad_comprometida: {
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
    tableName: 'detalle_contratos',
    timestamps: true
});

module.exports = DetalleContrato;