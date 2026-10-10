const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    tipo: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    ruc: {
        type: DataTypes.STRING(20),
        unique: true
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
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'instituciones',
    timestamps: true
});

module.exports = Institucion;