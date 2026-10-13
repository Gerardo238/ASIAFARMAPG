// Catálogos del sistema. Todo valor que se repite (ubicación, forma
// farmacéutica, unidad, tipo de institución, modalidad de compra, motivo de
// movimiento) se elige de una tabla y no se escribe a mano, para que nunca
// aparezcan variantes como "en_bodigo" que rompen los filtros y consultas.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const camposCatalogo = (id) => ({
    [id]: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    descripcion: { type: DataTypes.STRING(255) },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const definirCatalogo = (modelo, tabla, id) =>
    sequelize.define(modelo, camposCatalogo(id), { tableName: tabla, timestamps: true });

const Ubicacion = definirCatalogo('Ubicacion', 'ubicaciones', 'id_ubicacion');
const FormaFarmaceutica = definirCatalogo('FormaFarmaceutica', 'formas_farmaceuticas', 'id_forma_farmaceutica');
const UnidadMedida = definirCatalogo('UnidadMedida', 'unidades_medida', 'id_unidad_medida');
const TipoInstitucion = definirCatalogo('TipoInstitucion', 'tipos_institucion', 'id_tipo_institucion');
const ModalidadCompra = definirCatalogo('ModalidadCompra', 'modalidades_compra', 'id_modalidad');

// Motivos de entrada/salida de inventario. Los de "sistema" (compra, despacho,
// anulaciones) solo los usa el sistema; los demás son ajustes manuales.
const MotivoMovimiento = sequelize.define('MotivoMovimiento', {
    id_motivo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: { type: DataTypes.STRING(40), unique: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    tipo: { type: DataTypes.ENUM('entrada', 'salida'), allowNull: false },
    sistema: { type: DataTypes.BOOLEAN, defaultValue: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'motivos_movimiento', timestamps: true });

// Casa farmacéutica que fabrica el medicamento (Bayer, MK, ...)
const Laboratorio = sequelize.define('Laboratorio', {
    id_laboratorio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    pais: { type: DataTypes.STRING(80) },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'laboratorios', timestamps: true });

// Empresa que nos vende el producto y emite la factura
const Proveedor = sequelize.define('Proveedor', {
    id_proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    nit: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    direccion: { type: DataTypes.STRING(200) },
    telefono: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING(100) },
    contacto: { type: DataTypes.STRING(100) },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'proveedores', timestamps: true });

// Valores configurables (vigencias mínimas, días del semáforo, ...)
const Parametro = sequelize.define('Parametro', {
    clave: { type: DataTypes.STRING(60), primaryKey: true },
    valor: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.STRING(255) }
}, { tableName: 'parametros', timestamps: true });

module.exports = {
    Ubicacion, FormaFarmaceutica, UnidadMedida, TipoInstitucion, ModalidadCompra,
    MotivoMovimiento, Laboratorio, Proveedor, Parametro
};
