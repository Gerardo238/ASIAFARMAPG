const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Gestiones formales de un contrato ante la institución compradora:
//   prorroga:     el proveedor pide más plazo (con abogado y documentos de
//                 respaldo) ANTES de que venza el contrato. Si se aprueba,
//                 la fecha de fin del contrato pasa a ser fecha_hasta.
//   nota_tecnica: solo en contrato abierto; el proveedor no puede abastecer
//                 un renglón y se autoriza (por lo general 30 días) que las
//                 unidades lo compren por baja cuantía o compra directa.
//   oficio:       advertencia que la institución envía al proveedor por
//                 atrasos; después de 3 puede dejar de comprarle (salvo en
//                 contrato abierto).
const TIPOS_TRAMITE = ['prorroga', 'nota_tecnica', 'oficio'];
const ESTADOS_TRAMITE = ['solicitada', 'aprobada', 'rechazada', 'registrado', 'anulado'];

const TramiteContrato = sequelize.define('TramiteContrato', {
    id_tramite: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_contrato: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.ENUM(...TIPOS_TRAMITE), allowNull: false },
    // Renglón afectado (nota técnica) y pedido relacionado (oficio), si aplica
    id_detalle_contrato: { type: DataTypes.INTEGER },
    id_pedido: { type: DataTypes.INTEGER },
    numero_documento: { type: DataTypes.STRING(100) },
    // Fecha de la solicitud o del oficio
    fecha_documento: { type: DataTypes.DATEONLY, allowNull: false },
    causa: { type: DataTypes.STRING(40), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    // Prórroga: fin del contrato antes de la prórroga y el nuevo fin solicitado.
    // Nota técnica: período en que el renglón se compra por otra modalidad.
    fecha_fin_anterior: { type: DataTypes.DATEONLY },
    fecha_desde: { type: DataTypes.DATEONLY },
    fecha_hasta: { type: DataTypes.DATEONLY },
    estado: { type: DataTypes.ENUM(...ESTADOS_TRAMITE), allowNull: false },
    fecha_resolucion: { type: DataTypes.DATEONLY },
    observacion_resolucion: { type: DataTypes.TEXT },
    id_usuario: { type: DataTypes.INTEGER },
    id_usuario_resolucion: { type: DataTypes.INTEGER }
}, {
    tableName: 'tramites_contrato',
    timestamps: true,
    indexes: [{ fields: ['id_contrato', 'tipo'] }]
});

TramiteContrato.TIPOS = TIPOS_TRAMITE;
TramiteContrato.ESTADOS = ESTADOS_TRAMITE;

module.exports = TramiteContrato;
