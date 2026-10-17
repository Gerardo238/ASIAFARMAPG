const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Documentos adjuntos (foto o PDF de la factura, registro sanitario, ficha
// técnica...) de un ingreso de compra, un lote o un producto; el contrato y
// sus prórrogas u oficios; el acta de entrega o de devolución de un pedido.
// El archivo se guarda en la base de datos para que el respaldo (pg_dump) lo
// incluya. No se borra: se anula, como todo lo demás.
const ENTIDADES_ADJUNTO = ['ingresos', 'lotes', 'productos', 'contratos', 'pedidos'];

const Adjunto = sequelize.define('Adjunto', {
    id_adjunto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    entidad: { type: DataTypes.STRING(30), allowNull: false },
    id_registro: { type: DataTypes.INTEGER, allowNull: false },
    nombre_archivo: { type: DataTypes.STRING(200), allowNull: false },
    tipo_mime: { type: DataTypes.STRING(100), allowNull: false },
    tamano: { type: DataTypes.INTEGER, allowNull: false },
    datos: { type: DataTypes.BLOB, allowNull: false },
    descripcion: { type: DataTypes.STRING(200) },
    id_usuario: { type: DataTypes.INTEGER },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    tableName: 'adjuntos',
    timestamps: true,
    indexes: [{ fields: ['entidad', 'id_registro'] }]
});

Adjunto.ENTIDADES = ENTIDADES_ADJUNTO;

module.exports = Adjunto;
