const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Ingreso de compra: una factura de un proveedor. Cada línea de la factura
// crea un lote nuevo, así cada lote queda amarrado a su factura y proveedor.
const Ingreso = sequelize.define('Ingreso', {
    id_ingreso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    serie_factura: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    numero_factura: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    fecha_factura: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_recepcion: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    monto_total: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    estado: {
        type: DataTypes.ENUM('registrado', 'anulado'),
        defaultValue: 'registrado'
    },
    observaciones: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'ingresos',
    timestamps: true,
    indexes: [{ unique: true, fields: ['id_proveedor', 'serie_factura', 'numero_factura'] }]
});

module.exports = Ingreso;
