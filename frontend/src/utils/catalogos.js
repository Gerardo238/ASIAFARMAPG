// Catálogos de valores fijos del sistema (fase 1 del plan de correcciones).
// Evitan que se escriba texto libre en campos que deben ser consistentes,
// para que luego los filtros y las consultas funcionen correctamente.

export const UBICACIONES_LOTE = [
    { value: 'en_bodega', label: 'En bodega' },
    { value: 'en_empaque', label: 'En empaque' },
    { value: 'en_transporte', label: 'En transporte' },
    { value: 'entregado', label: 'Entregado' },
    { value: 'en_cuarentena', label: 'En cuarentena' },
    { value: 'vencido', label: 'Vencido' },
];

export const etiquetaUbicacion = (valor) => {
    const encontrada = UBICACIONES_LOTE.find(u => u.value === valor);
    return encontrada ? encontrada.label : (valor || '—');
};

