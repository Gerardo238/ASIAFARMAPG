const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Recorrido de un pedido. "Retrasado" no es un estado: se calcula comparando
// la fecha programada con la de hoy o con la fecha real de entrega.
const ESTADOS_PEDIDO = ['pendiente', 'en_preparacion', 'empacado', 'en_transporte', 'entregado', 'anulado'];

// Orden permitido de avance (la anulación se valida aparte)
const SIGUIENTE_ESTADO = {
    pendiente: 'en_preparacion',
    en_preparacion: 'empacado',
    empacado: 'en_transporte',
    en_transporte: 'entregado'
};

const Pedido = sequelize.define('Pedido', {
    id_pedido: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_contrato: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    numero_pedido: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    fecha_pedido: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_programada: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_real_entrega: {
        type: DataTypes.DATEONLY
    },
    // Carta de compromiso de entrega: si el proveedor pidió más tiempo, el
    // retraso se cuenta desde el día hábil siguiente a esta fecha.
    fecha_compromiso: {
        type: DataTypes.DATEONLY
    },
    documento_compromiso: {
        type: DataTypes.STRING(100)
    },
    estado: {
        type: DataTypes.ENUM(...ESTADOS_PEDIDO),
        defaultValue: 'pendiente'
    },
    monto_total: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    observaciones: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'pedidos',
    timestamps: true
});

Pedido.ESTADOS = ESTADOS_PEDIDO;
Pedido.SIGUIENTE_ESTADO = SIGUIENTE_ESTADO;

module.exports = Pedido;
