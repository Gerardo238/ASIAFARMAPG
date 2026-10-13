// Fechas de negocio (fabricación, vencimiento, factura, entrega...) se manejan
// como texto 'YYYY-MM-DD' (DATEONLY), sin hora ni zona horaria. Así una fecha
// nunca se corre un día por la diferencia entre UTC y Guatemala.

const ZONA_HORARIA = 'America/Guatemala';
const FORMATO = /^\d{4}-\d{2}-\d{2}$/;

// Fecha de hoy en Guatemala, como 'YYYY-MM-DD'
const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA });

const aPartes = (iso) => iso.split('-').map(Number);

const esFechaValida = (valor) => {
    if (typeof valor !== 'string' || !FORMATO.test(valor)) return false;
    const [a, m, d] = aPartes(valor);
    const f = new Date(Date.UTC(a, m - 1, d));
    return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
};

// Acepta 'YYYY-MM-DD', 'YYYY-MM-DDT...' o Date y devuelve 'YYYY-MM-DD' (o null)
const normalizarFecha = (valor) => {
    if (!valor) return null;
    if (valor instanceof Date) return isNaN(valor) ? null : valor.toISOString().slice(0, 10);
    const texto = String(valor).slice(0, 10);
    return esFechaValida(texto) ? texto : null;
};

const sumarDias = (iso, dias) => {
    const [a, m, d] = aPartes(iso);
    return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
};

const sumarMeses = (iso, meses) => {
    const [a, m, d] = aPartes(iso);
    return new Date(Date.UTC(a, m - 1 + meses, d)).toISOString().slice(0, 10);
};

// Días desde 'desde' hasta 'hasta' (negativo si 'hasta' ya pasó)
const diasEntre = (desde, hasta) => {
    const [a1, m1, d1] = aPartes(desde);
    const [a2, m2, d2] = aPartes(hasta);
    return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
};

const formatoGT = (iso) => {
    if (!iso) return '—';
    const [a, m, d] = aPartes(iso);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
};

module.exports = { hoy, esFechaValida, normalizarFecha, sumarDias, sumarMeses, diasEntre, formatoGT };
