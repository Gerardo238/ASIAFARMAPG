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

// Modalidades de la Ley de Contrataciones del Estado (GUATECOMPRAS), con el
// rango de monto que las define y el plazo de entrega de sus órdenes
// (entrevista al encargado de contratos). Cotización y licitación no tienen
// plazo fijo: se usa el parámetro DIAS_HABILES_ENTREGA o lo que diga el contrato.
const MODALIDADES = [
    { nombre: 'Baja cuantía', monto_minimo: 0.01, monto_maximo: 25000, dias_habiles_entrega: 3, contrato_abierto: false, descripcion: 'Hasta Q25,000. La orden se entrega en 1 a 3 días hábiles o la unidad puede anularla.' },
    { nombre: 'Compra directa', monto_minimo: 25000.01, monto_maximo: 90000, dias_habiles_entrega: 3, contrato_abierto: false, descripcion: 'De Q25,000 a Q90,000. La orden se entrega en 1 a 3 días hábiles o la unidad puede anularla.' },
    { nombre: 'Cotización', monto_minimo: 90000.01, monto_maximo: 900000, dias_habiles_entrega: null, contrato_abierto: false, descripcion: 'De Q90,000 a Q900,000. La institución debe adquirir la cantidad exacta adjudicada.' },
    { nombre: 'Licitación pública', monto_minimo: 900000.01, monto_maximo: null, dias_habiles_entrega: null, contrato_abierto: false, descripcion: 'Más de Q900,000. La institución debe adquirir la cantidad exacta adjudicada.' },
    { nombre: 'Contrato abierto', monto_minimo: null, monto_maximo: null, dias_habiles_entrega: 3, contrato_abierto: true, descripcion: 'El proveedor administra sus entregas; la institución no está obligada a comprar todo lo adjudicado.' },
    { nombre: 'Procedimiento de excepción', monto_minimo: null, monto_maximo: null, dias_habiles_entrega: null, contrato_abierto: false },
    { nombre: 'Subasta electrónica inversa', monto_minimo: null, monto_maximo: null, dias_habiles_entrega: null, contrato_abierto: false }
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
    // La devolución de una institución se registra desde el pedido, para que quede ligada a él
    { codigo: 'DEVOLUCION_CLIENTE', nombre: 'Devolución de institución', tipo: 'entrada', sistema: true },
    { codigo: 'ANULACION_DEVOLUCION', nombre: 'Salida por anulación de devolución', tipo: 'salida', sistema: true },
    { codigo: 'AJUSTE_POSITIVO', nombre: 'Ajuste por inventario físico (sobrante)', tipo: 'entrada', sistema: false },
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
    { clave: 'DIAS_ALERTA_PEDIDO', valor: '5', descripcion: 'Días antes de la fecha programada en que un pedido que no ha salido de bodega aparece en alertas.' },
    { clave: 'DIAS_HABILES_ENTREGA', valor: '3', descripcion: 'Días hábiles que tiene el proveedor para entregar una orden cuando la modalidad no indica otro plazo.' },
    { clave: 'LIMITE_OFICIOS', valor: '3', descripcion: 'Oficios de advertencia después de los cuales la institución puede dejar de comprarnos (excepto en contrato abierto).' }
];

const sembrarNombres = async (modelo, nombres) => {
    for (const nombre of nombres) await modelo.findOrCreate({ where: { nombre } });
};

// Las modalidades que ya existían en una base anterior reciben el rango y el
// plazo en la migración que agrega esas columnas (config/migraciones.js).
const sembrarCatalogos = async () => {
    await sembrarNombres(Ubicacion, UBICACIONES);
    await sembrarNombres(FormaFarmaceutica, FORMAS);
    await sembrarNombres(UnidadMedida, UNIDADES);
    await sembrarNombres(TipoInstitucion, TIPOS_INSTITUCION);
    for (const m of MODALIDADES) await ModalidadCompra.findOrCreate({ where: { nombre: m.nombre }, defaults: m });
    for (const m of MOTIVOS) {
        const [motivo, creado] = await MotivoMovimiento.findOrCreate({ where: { codigo: m.codigo }, defaults: m });
        // Un motivo que pasó a ser del sistema deja de estar disponible para ajustes manuales
        if (!creado && m.sistema && !motivo.sistema) await motivo.update({ sistema: true });
    }
    for (const p of PARAMETROS) await Parametro.findOrCreate({ where: { clave: p.clave }, defaults: p });
};

module.exports = { sembrarCatalogos, MODALIDADES };
