const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Devolución de una institución sobre un pedido ya entregado (producto
// vencido, dañado, enviado por error...). El producto regresa al mismo lote
// del que salió y la cantidad vuelve al saldo del contrato. Si la devolución
// se registró por error, se anula y todo vuelve a como estaba.
const DevolucionPedido = sequelize.define('DevolucionPedido', {
    id_devolucion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_pedido: { type: DataTypes.INTEGER, allowNull: false },
    id_usuario: { type: DataTypes.INTEGER },
    fecha_devolucion: { type: DataTypes.DATEONLY, allowNull: false },
    causa: { type: DataTypes.STRING(40), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    // Acta o nota de devolución de la institución
    documento: { type: DataTypes.STRING(100) },
    unidades: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    estado: { type: DataTypes.ENUM('registrada', 'anulada'), allowNull: false, defaultValue: 'registrada' },
    motivo_anulacion: { type: DataTypes.TEXT }
}, { tableName: 'devoluciones_pedido', timestamps: true });

// Cuánto se devolvió de cada lote asignado al pedido
const DetalleDevolucion = sequelize.define('DetalleDevolucion', {
    id_detalle_devolucion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_devolucion: { type: DataTypes.INTEGER, allowNull: false },
    id_asignacion: { type: DataTypes.INTEGER, allowNull: false },
    id_detalle_pedido: { type: DataTypes.INTEGER, allowNull: false },
    id_lote: { type: DataTypes.INTEGER, allowNull: false },
    cantidad: { type: DataTypes.DECIMAL(12, 2), allowNull: false }
}, { tableName: 'detalle_devoluciones', timestamps: true });

module.exports = { DevolucionPedido, DetalleDevolucion };
