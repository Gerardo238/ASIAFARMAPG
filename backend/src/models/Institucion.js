const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Entidad compradora del Estado (hospital, centro de salud, IGSS, ...)
const Institucion = sequelize.define('Institucion', {
    id_institucion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    id_tipo_institucion: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nit: {
        type: DataTypes.STRING(20),
        unique: true
    },
    unidad_ejecutora: {
        type: DataTypes.STRING(150)
    },
    departamento: {
        type: DataTypes.STRING(60)
    },
    direccion: {
        type: DataTypes.STRING(200)
    },
    telefono: {
        type: DataTypes.STRING(20)
    },
    email: {
        type: DataTypes.STRING(100)
    },
    contacto: {
        type: DataTypes.STRING(100)
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'instituciones',
    timestamps: true
});

module.exports = Institucion;
