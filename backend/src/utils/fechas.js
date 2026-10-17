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

// ---------- Días hábiles ----------
// Los plazos de entrega del Estado se cuentan en días hábiles: de lunes a
// viernes, sin asuetos nacionales. El 24 y el 31 de diciembre son medio día
// y se cuentan como hábiles.
const ASUETOS_FIJOS = ['01-01', '05-01', '06-30', '09-15', '10-20', '11-01', '12-25'];

// Domingo de Pascua (algoritmo de Meeus/Jones/Butcher), para la Semana Santa
const pascua = (anio) => {
    const a = anio % 19, b = Math.floor(anio / 100), c = anio % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
};

const asuetosDelAnio = {};
const esAsueto = (iso) => {
    const anio = Number(iso.slice(0, 4));
    if (!asuetosDelAnio[anio]) {
        const domingo = pascua(anio);
        asuetosDelAnio[anio] = new Set([...ASUETOS_FIJOS.map(md => `${anio}-${md}`), sumarDias(domingo, -3), sumarDias(domingo, -2)]);
    }
    return asuetosDelAnio[anio].has(iso);
};

const esDiaHabil = (iso) => {
    const [a, m, d] = aPartes(iso);
    const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
    return dia !== 0 && dia !== 6 && !esAsueto(iso);
};

// Fecha que resulta de avanzar (o retroceder, si dias < 0) N días hábiles
const sumarDiasHabiles = (iso, dias) => {
    let fecha = iso;
    let faltan = Math.abs(dias);
    const paso = dias < 0 ? -1 : 1;
    while (faltan > 0) {
        fecha = sumarDias(fecha, paso);
        if (esDiaHabil(fecha)) faltan -= 1;
    }
    return fecha;
};

// Días hábiles después de 'desde' hasta 'hasta' inclusive (0 si 'hasta' no es posterior).
// Así el retraso empieza a contar el día hábil siguiente a la fecha comprometida.
const diasHabilesEntre = (desde, hasta) => {
    if (hasta <= desde) return 0;
    let n = 0;
    for (let f = sumarDias(desde, 1); f <= hasta; f = sumarDias(f, 1)) if (esDiaHabil(f)) n += 1;
    return n;
};

module.exports = {
    hoy, esFechaValida, normalizarFecha, sumarDias, sumarMeses, diasEntre, formatoGT,
    esDiaHabil, sumarDiasHabiles, diasHabilesEntre
};
