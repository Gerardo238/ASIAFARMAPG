// Funciones para mostrar fechas sin desfase por la zona horaria.
// Las fechas sin hora (ej. "2026-01-01") se leen como fecha local; si se usan
// con new Date() directamente, en Guatemala se muestran un día antes.

const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})(T00:00:00(\.000)?Z)?$/;

export const parseFecha = (valor) => {
    if (!valor) return null;
    const m = typeof valor === 'string' ? valor.match(SOLO_FECHA) : null;
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Date(valor);
};

export const formatFecha = (valor) => {
    const fecha = parseFecha(valor);
    if (!fecha || isNaN(fecha)) return '—';
    return fecha.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const diasRestantes = (valor) => {
    const fecha = parseFecha(valor);
    if (!fecha || isNaN(fecha)) return 0;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((fecha - hoy) / (1000 * 60 * 60 * 24));
};