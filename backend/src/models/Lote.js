const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Catálogo de ubicaciones del lote (fase 1 del plan de correcciones).
// Evita que se escriba texto libre (por ejemplo "en_bodigo") y que luego
// esos lotes no aparezcan en los filtros y consultas.
const UBICACIONES_LOTE = ['en_bodega', 'en_empaque', 'en_transporte', 'entregado', 'en_cuarentena', 'vencido'];

const Lote = sequelize.define('Lote', {
    id_lote: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_producto: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    numero_lote: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    fecha_fabricacion: {
        type: DataTypes.DATE
    },
    fecha_vencimiento: {
        type: DataTypes.DATE,
        allowNull: false
    },
    cantidad_inicial: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    cantidad_disponible: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    ubicacion: {
        type: DataTypes.ENUM(...UBICACIONES_LOTE),
        defaultValue: 'en_bodega'
    },
    estado: {
        type: DataTypes.ENUM('en_bodega', 'en_preparacion', 'despachado', 'entregado', 'vencido'),
        defaultValue: 'en_bodega'
    }
}, {
    tableName: 'lotes',
    timestamps: true
});

Lote.UBICACIONES = UBICACIONES_LOTE;

module.exports = Lote;
