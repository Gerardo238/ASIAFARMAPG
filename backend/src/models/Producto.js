const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Producto genérico (ej. "Lidocaína 2% solución inyectable"). Aparece una sola
// vez; cada compra se registra como un lote nuevo de este producto y su
// existencia es la suma de sus lotes.
const Producto = sequelize.define('Producto', {
    id_producto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    codigo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    id_forma_farmaceutica: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    concentracion: {
        type: DataTypes.STRING(100)
    },
    id_unidad_medida: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    stock_minimo: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'productos',
    timestamps: true
});

module.exports = Producto;
