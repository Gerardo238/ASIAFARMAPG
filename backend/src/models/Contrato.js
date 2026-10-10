const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: false
    },
    monto_total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('activo', 'completado', 'vencido', 'cancelado'),
        defaultValue: 'activo'
    },
    observaciones: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'contratos',
    timestamps: true
});

module.exports = Contrato;