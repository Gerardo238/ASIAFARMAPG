const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Contrato adjudicado en GUATECOMPRAS. Se identifica por su NOG (Número de
// Operación Guatecompras) y su número de contrato; sus productos son los
// renglones (DetalleContrato).
const Contrato = sequelize.define('Contrato', {
    id_contrato: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_institucion: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    numero_contrato: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    nog: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    id_modalidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    // Meses de vida útil que exige la institución al recibir el producto.
    // Si se deja vacío se usa el parámetro general del sistema.
    vigencia_minima_meses: {
        type: DataTypes.INTEGER
    },
    monto_total: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    estado: {
        type: DataTypes.ENUM('vigente', 'completado', 'vencido', 'cancelado', 'anulado'),
        defaultValue: 'vigente'
    },
    observaciones: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'contratos',
    timestamps: true
});

module.exports = Contrato;
