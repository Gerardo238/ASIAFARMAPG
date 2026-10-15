// Datos base de los catálogos. Se ejecuta al iniciar el servidor y solo crea
// lo que falta, así que se puede correr cuantas veces se quiera.
const {
    Ubicacion, FormaFarmaceutica, UnidadMedida, TipoInstitucion, ModalidadCompra,
    MotivoMovimiento, Parametro
} = require('../models/index');

const UBICACIONES = ['Bodega general', 'Cadena de frío', 'Área de cuarentena', 'Área de empaque', 'Área de despacho'];

const FORMAS = [
    'Tableta', 'Cápsula', 'Solución inyectable', 'Polvo para reconstituir', 'Jarabe', 'Suspensión',
    'Solución oral', 'Gotas', 'Crema', 'Ungüento', 'Gel', 'Óvulo', 'Supositorio', 'Material médico quirúrgico'
];

const UNIDADES = ['Unidad', 'Tableta', 'Cápsula', 'Ampolla', 'Vial', 'Frasco', 'Caja', 'Blíster', 'Sobre', 'Tubo', 'Rollo', 'Galón'];

const TIPOS_INSTITUCION = [
    'Hospital nacional', 'Hospital regional', 'Centro de salud', 'Puesto de salud',
    'Dirección de Área de Salud', 'IGSS', 'Institución privada', 'Otra'
];

// Modalidades de la Ley de Contrataciones del Estado (GUATECOMPRAS)
const MODALIDADES = [
    'Baja cuantía', 'Compra directa', 'Cotización', 'Licitación pública',
    'Contrato abierto', 'Procedimiento de excepción', 'Subasta electrónica inversa'
];

// codigo != null: lo usa el sistema; sistema=false: disponible para ajustes manuales
const MOTIVOS = [
    { codigo: 'COMPRA', nombre: 'Ingreso por compra', tipo: 'entrada', sistema: true },
    { codigo: 'DESPACHO', nombre: 'Despacho de pedido', tipo: 'salida', sistema: true },
    { codigo: 'ANULACION_PEDIDO', nombre: 'Reingreso por anulación de pedido', tipo: 'entrada', sistema: true },
    { codigo: 'ANULACION_INGRESO', nombre: 'Salida por anulación de ingreso', tipo: 'salida', sistema: true },
    { codigo: 'RESTAURACION_INGRESO', nombre: 'Reingreso por restauración de ingreso', tipo: 'entrada', sistema: true },
    { codigo: 'ANULACION_LOTE', nombre: 'Salida por anulación de lote', tipo: 'salida', sistema: true },
    { codigo: 'RESTAURACION_LOTE', nombre: 'Reingreso por restauración de lote', tipo: 'entrada', sistema: true },
    { codigo: 'AJUSTE_POSITIVO', nombre: 'Ajuste por inventario físico (sobrante)', tipo: 'entrada', sistema: false },
    { codigo: 'DEVOLUCION_CLIENTE', nombre: 'Devolución de institución', tipo: 'entrada', sistema: false },
    { codigo: 'AJUSTE_NEGATIVO', nombre: 'Ajuste por inventario físico (faltante)', tipo: 'salida', sistema: false },
    { codigo: 'MERMA', nombre: 'Merma o daño', tipo: 'salida', sistema: false },
    { codigo: 'DESTRUCCION', nombre: 'Destrucción por vencimiento', tipo: 'salida', sistema: false },
    { codigo: 'DEVOLUCION_PROVEEDOR', nombre: 'Devolución a proveedor', tipo: 'salida', sistema: false }
];

const PARAMETROS = [
    { clave: 'VIGENCIA_MINIMA_INGRESO_MESES', valor: '12', descripcion: 'Meses de vida útil mínima que debe tener un lote para poder ingresarlo.' },
    { clave: 'VIGENCIA_MINIMA_DESPACHO_MESES', valor: '12', descripcion: 'Meses de vida útil mínima al despachar, si el contrato no indica otra.' },
    { clave: 'DIAS_SEMAFORO_ROJO', valor: '90', descripcion: 'Días antes del vencimiento en que un lote pasa a estado crítico (rojo).' },
    { clave: 'DIAS_SEMAFORO_AMARILLO', valor: '180', descripcion: 'Días antes del vencimiento en que un lote pasa a alerta (amarillo).' },
    { clave: 'DIAS_ALERTA_CONTRATO', valor: '30', descripcion: 'Días antes de su fin en que un contrato con saldo pendiente aparece en alertas.' },
    { clave: 'DIAS_ALERTA_PEDIDO', valor: '5', descripcion: 'Días antes de la fecha programada en que un pedido que no ha salido de bodega aparece en alertas.' }
];

const sembrarNombres = async (modelo, nombres) => {
    for (const nombre of nombres) await modelo.findOrCreate({ where: { nombre } });
};

const sembrarCatalogos = async () => {
    await sembrarNombres(Ubicacion, UBICACIONES);
    await sembrarNombres(FormaFarmaceutica, FORMAS);
    await sembrarNombres(UnidadMedida, UNIDADES);
    await sembrarNombres(TipoInstitucion, TIPOS_INSTITUCION);
    await sembrarNombres(ModalidadCompra, MODALIDADES);
    for (const m of MOTIVOS) await MotivoMovimiento.findOrCreate({ where: { codigo: m.codigo }, defaults: m });
    for (const p of PARAMETROS) await Parametro.findOrCreate({ where: { clave: p.clave }, defaults: p });
};

module.exports = { sembrarCatalogos };
