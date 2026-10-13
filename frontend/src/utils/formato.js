export const moneda = (valor) =>
    valor === null || valor === undefined || valor === '' ? '—'
        : `Q ${Number(valor).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const numero = (valor) =>
    valor === null || valor === undefined || valor === '' ? '—'
        : Number(valor).toLocaleString('es-GT', { maximumFractionDigits: 2 });

// Mensaje de error de la API (incluye el detalle cuando viene una lista)
export const mensajeError = (error, porDefecto = 'Ocurrió un error. Intenta de nuevo.') => {
    const datos = error?.response?.data;
    if (!datos) return porDefecto;
    const detalle = Array.isArray(datos.detalle) ? ` ${datos.detalle.join('; ')}.` : '';
    return (datos.mensaje || porDefecto) + detalle;
};
