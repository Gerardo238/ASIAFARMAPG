const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Condición del lote en bodega. El recorrido de un despacho (preparación,
// empaque, transporte, entrega) no se guarda aquí sino en el seguimiento del
// pedido, porque de un mismo lote puede haber unidades en bodega y otras en
// camino al mismo tiempo.
const CONDICIONES_LOTE = ['disponible', 'cuarentena', 'bloqueado', 'agotado', 'vencido', 'anulado'];

const Lote = sequelize.define('Lote', {
    id_lote: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_ingreso: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_producto: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_laboratorio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    numero_lote: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    fecha_fabricacion: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_vencimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    cantidad_recibida: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    cantidad_disponible: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    costo_unitario: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    id_ubicacion: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    condicion: {
        type: DataTypes.ENUM(...CONDICIONES_LOTE),
        defaultValue: 'disponible'
    },
    motivo_condicion: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'lotes',
    timestamps: true,
    indexes: [{ fields: ['id_producto', 'fecha_vencimiento'] }, { fields: ['numero_lote'] }],
    validate: {
        vencimientoPosteriorAFabricacion() {
            if (this.fecha_fabricacion && this.fecha_vencimiento && this.fecha_vencimiento <= this.fecha_fabricacion) {
                throw new Error('La fecha de vencimiento debe ser posterior a la fecha de fabricación.');
            }
        }
    }
});

Lote.CONDICIONES = CONDICIONES_LOTE;

module.exports = Lote;
