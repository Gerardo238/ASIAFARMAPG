const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Renglón del contrato: producto, cantidad adjudicada y precio. Lo pedido,
// lo entregado y el saldo se calculan a partir de los pedidos.
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
    numero_renglon: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_producto: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cantidad_contratada: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    precio_unitario: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'detalle_contratos',
    timestamps: true,
    indexes: [{ unique: true, fields: ['id_contrato', 'id_producto'] }]
});

module.exports = DetalleContrato;
