const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Cuánto de cada lote se asignó a una línea de pedido (resultado del FEFO).
// Es el enlace que permite saber a qué institución llegó cada lote.
const AsignacionLote = sequelize.define('AsignacionLote', {
    id_asignacion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_detalle_pedido: { type: DataTypes.INTEGER, allowNull: false },
    id_lote: { type: DataTypes.INTEGER, allowNull: false },
    cantidad: { type: DataTypes.DECIMAL(12, 2), allowNull: false }
}, { tableName: 'asignaciones_lote', timestamps: true });

// Historial de estados del pedido: quién lo movió de etapa y cuándo
const SeguimientoPedido = sequelize.define('SeguimientoPedido', {
    id_seguimiento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_pedido: { type: DataTypes.INTEGER, allowNull: false },
    estado: { type: DataTypes.STRING(30), allowNull: false },
    id_usuario: { type: DataTypes.INTEGER },
    observacion: { type: DataTypes.TEXT },
    fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'seguimiento_pedidos', timestamps: false });

module.exports = { AsignacionLote, SeguimientoPedido };
