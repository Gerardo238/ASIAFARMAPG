const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Bitácora de auditoría (ver utils/auditoria.js)
const Auditoria = sequelize.define('Auditoria', {
    id_auditoria: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tabla: { type: DataTypes.STRING(50), allowNull: false },
    id_registro: { type: DataTypes.STRING(50), allowNull: false },
    accion: { type: DataTypes.STRING(30), allowNull: false },
    datos_antes: { type: DataTypes.JSONB },
    datos_despues: { type: DataTypes.JSONB },
    id_usuario: { type: DataTypes.INTEGER },
    motivo: { type: DataTypes.TEXT },
    ip: { type: DataTypes.STRING(60) },
    fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
    tableName: 'auditoria',
    timestamps: false,
    indexes: [{ fields: ['tabla', 'id_registro'] }, { fields: ['fecha'] }]
});

module.exports = Auditoria;
