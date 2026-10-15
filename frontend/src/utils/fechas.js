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

// Para marcas de tiempo (movimientos, auditoría, seguimiento)
export const formatFechaHora = (valor) => {
    if (!valor) return '—';
    const fecha = new Date(valor);
    if (isNaN(fecha)) return '—';
    // Espacios no separables para que fecha y hora no se partan en dos líneas
    return fecha.toLocaleString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(/ /g, ' ');
};

export const diasRestantes = (valor) => {
    const fecha = parseFecha(valor);
    if (!fecha || isNaN(fecha)) return 0;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((fecha - hoy) / (1000 * 60 * 60 * 24));
};

// Hoy en formato YYYY-MM-DD (hora local), para inputs type="date"
export const hoyISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const primerDiaMesISO = () => `${hoyISO().slice(0, 8)}01`;

// Tiempo hasta el vencimiento dicho como lo diría una persona
export const tiempoRestante = (dias) => {
    if (dias < 0) return `venció hace ${tiempoRestante(-dias).replace('en ', '')}`;
    if (dias === 0) return 'vence hoy';
    if (dias < 60) return `en ${dias} día${dias === 1 ? '' : 's'}`;
    if (dias < 730) return `en ${Math.round(dias / 30.4)} meses`;
    const anios = Math.floor(dias / 365);
    const meses = Math.round((dias - anios * 365) / 30.4);
    return `en ${anios} año${anios === 1 ? '' : 's'}${meses ? ` y ${meses} m` : ''}`;
};
