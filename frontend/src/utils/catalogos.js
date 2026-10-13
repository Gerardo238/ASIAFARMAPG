// Etiquetas y colores de los valores fijos del sistema. Los catálogos
// editables (ubicaciones, formas farmacéuticas, ...) vienen de la API.

export const CONDICIONES_LOTE = {
    disponible: { label: 'Disponible', tono: 'verde' },
    cuarentena: { label: 'En cuarentena', tono: 'amarillo' },
    bloqueado: { label: 'Bloqueado', tono: 'rojo' },
    agotado: { label: 'Agotado', tono: 'gris' },
    vencido: { label: 'Vencido', tono: 'rojo' },
    anulado: { label: 'Anulado', tono: 'gris' }
};

export const ESTADOS_PEDIDO = {
    pendiente: { label: 'Pendiente', tono: 'amarillo' },
    en_preparacion: { label: 'En preparación', tono: 'azul' },
    empacado: { label: 'Empacado', tono: 'morado' },
    en_transporte: { label: 'En transporte', tono: 'azul' },
    entregado: { label: 'Entregado', tono: 'verde' },
    anulado: { label: 'Anulado', tono: 'gris' }
};

export const ORDEN_PEDIDO = ['pendiente', 'en_preparacion', 'empacado', 'en_transporte', 'entregado'];

export const ACCION_SIGUIENTE = {
    en_preparacion: 'Marcar como empacado',
    empacado: 'Enviar a transporte',
    en_transporte: 'Registrar entrega'
};

export const ESTADOS_CONTRATO = {
    vigente: { label: 'Vigente', tono: 'verde' },
    completado: { label: 'Completado', tono: 'azul' },
    vencido: { label: 'Vencido', tono: 'rojo' },
    cancelado: { label: 'Cancelado', tono: 'gris' },
    anulado: { label: 'Anulado', tono: 'gris' }
};

export const ESTADOS_INGRESO = {
    registrado: { label: 'Registrado', tono: 'verde' },
    anulado: { label: 'Anulado', tono: 'gris' }
};

export const SEMAFORO = {
    verde: { label: 'Normal', tono: 'verde' },
    amarillo: { label: 'Alerta', tono: 'amarillo' },
    rojo: { label: 'Crítico', tono: 'rojo' },
    vencido: { label: 'Vencido', tono: 'rojo' }
};

export const ACCIONES_AUDITORIA = {
    crear: 'Creó', editar: 'Modificó', anular: 'Anuló', restaurar: 'Restauró',
    cambio_estado: 'Cambió estado', ajuste_inventario: 'Ajustó inventario'
};

export const TABLAS_AUDITORIA = {
    productos: 'Productos', lotes: 'Lotes', ingresos: 'Ingresos de compra', contratos: 'Contratos',
    pedidos: 'Pedidos', instituciones: 'Instituciones', usuarios: 'Usuarios', proveedores: 'Proveedores',
    laboratorios: 'Laboratorios', parametros: 'Parámetros', ubicaciones: 'Ubicaciones',
    formas_farmaceuticas: 'Formas farmacéuticas', unidades_medida: 'Unidades de medida',
    tipos_institucion: 'Tipos de institución', modalidades_compra: 'Modalidades de compra',
    motivos_movimiento: 'Motivos de movimiento'
};

export const ROLES = {
    administrador: 'Administrador', gerente: 'Gerente', bodeguero: 'Bodeguero', encargado_contratos: 'Encargado de contratos'
};

export const DEPARTAMENTOS_GT = [
    'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula', 'El Progreso', 'Escuintla', 'Guatemala',
    'Huehuetenango', 'Izabal', 'Jalapa', 'Jutiapa', 'Petén', 'Quetzaltenango', 'Quiché', 'Retalhuleu',
    'Sacatepéquez', 'San Marcos', 'Santa Rosa', 'Sololá', 'Suchitepéquez', 'Totonicapán', 'Zacapa'
];

export const etiqueta = (mapa, valor) => mapa[valor]?.label || valor || '—';
