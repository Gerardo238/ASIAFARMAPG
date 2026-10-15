// Componentes de interfaz compartidos por todas las pantallas, para que el
// sistema se vea y se comporte igual en todos los módulos.
import { X, Sun, Moon, ArrowUp, ArrowDown } from 'lucide-react';
import { useColors, MARCA } from '../hooks/useColors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/catalogos';
import { useTonos } from '../hooks/useTonos';


export const Pagina = ({ children }) => {
    const c = useColors();
    return <div className="px-6 py-7 lg:px-10 lg:py-8 min-h-screen" style={{ backgroundColor: c.bg }}>{children}</div>;
};

// Interruptor sol/luna y usuario, a la derecha del título de cada página
const BarraUsuario = () => {
    const c = useColors();
    const { darkMode, toggleDarkMode } = useTheme();
    const { usuario } = useAuth();
    const iniciales = `${usuario?.nombre?.[0] || ''}${usuario?.apellido?.[0] || ''}`.toUpperCase();
    return (
        <div className="flex items-center gap-6">
            <button onClick={toggleDarkMode} className="af-boton flex items-center gap-2" aria-label="Cambiar tema" title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
                <Sun size={15} style={{ color: c.textSecondary }} />
                <span className="relative w-8 h-[18px] rounded-full transition-colors" style={{ backgroundColor: darkMode ? MARCA.azul : (c.darkMode ? '#3A3A47' : '#E6E9F0') }}>
                    <span className="absolute top-[3px] w-3 h-3 rounded-full transition-all" style={{ left: darkMode ? 17 : 3, backgroundColor: darkMode ? '#FFFFFF' : MARCA.azul }} />
                </span>
                <Moon size={15} style={{ color: c.textSecondary }} />
            </button>
            <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white" style={{ backgroundColor: MARCA.azul }}>{iniciales}</div>
                <div className="leading-tight hidden md:block">
                    <p className="text-[13px] font-medium" style={{ color: c.textPrimary }}>{usuario?.nombre} {usuario?.apellido}</p>
                    <p className="text-[11px]" style={{ color: c.textSecondary }}>{ROLES[usuario?.rol]}</p>
                </div>
            </div>
        </div>
    );
};

// Título de la página sobre el fondo, acciones a su lado y el usuario a la derecha
export const Encabezado = ({ titulo, subtitulo, children }) => {
    const c = useColors();
    return (
        <header className="mb-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-5 min-w-0">
                    <h1 className="text-[26px] font-semibold leading-tight" style={{ color: c.textPrimary }}>{titulo}</h1>
                    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
                </div>
                <BarraUsuario />
            </div>
            {subtitulo && <p className="text-[13px] mt-1 max-w-3xl" style={{ color: c.textSecondary }}>{subtitulo}</p>}
        </header>
    );
};

// Píldora gris clara junto al título (como el rango de fechas de la referencia)
export const Pildora = ({ children, icono: Icono }) => {
    const c = useColors();
    return (
        <span className="inline-flex items-center gap-2 h-8 px-3 rounded-lg text-[12px] font-medium" style={{ backgroundColor: c.darkMode ? '#2A2A35' : '#EEEEF0', color: c.textPrimary }}>
            {children}{Icono && <Icono size={14} style={{ color: c.textSecondary }} />}
        </span>
    );
};

// variante "tinta": bloque azul sólido para lo que pide acción
export const Tarjeta = ({ titulo, nota, icono: Icono, acciones, children, className = '', sinPadding = false, variante = 'normal' }) => {
    const c = useColors();
    const tinta = variante === 'tinta';
    return (
        <section className={`rounded-xl mb-5 ${className}`} style={{ backgroundColor: tinta ? MARCA.azul : c.card }}>
            {(titulo || acciones) && (
                <div className="flex flex-wrap items-start justify-between gap-2 px-6 pt-5 pb-3">
                    <div className="min-w-0">
                        <h2 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: tinta ? '#FFFFFF' : c.textPrimary }}>
                            {Icono && <Icono size={17} strokeWidth={1.6} />}{titulo}
                        </h2>
                        {nota && <p className="text-[12px] mt-0.5" style={{ color: tinta ? 'rgba(255,255,255,0.8)' : c.textSecondary }}>{nota}</p>}
                    </div>
                    {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
                </div>
            )}
            <div className={sinPadding ? '' : 'px-6 pb-6'}>{children}</div>
        </section>
    );
};

export const Boton = ({ variante = 'primario', icono: Icono, children, className = '', pequeno = false, ...props }) => {
    const c = useColors();
    const t = useTonos();
    const estilos = {
        primario: { backgroundColor: MARCA.azul, color: '#FFFFFF' },
        secundario: { backgroundColor: c.darkMode ? '#33333F' : '#EEEEF0', color: c.textPrimary },
        peligro: { backgroundColor: t.rojo.bg, color: t.rojo.text },
        exito: { backgroundColor: t.verde.bg, color: t.verde.text },
        info: { backgroundColor: t.azul.bg, color: t.azul.text },
        acento: { backgroundColor: MARCA.azul, color: '#FFFFFF' },
        claro: { backgroundColor: '#FFFFFF', color: MARCA.azul }
    };
    return (
        <button
            type="button"
            className={`af-boton inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition hover:brightness-95 active:brightness-90 disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap ${pequeno ? 'px-3 h-7 text-[12px]' : 'px-5 h-9 text-[13px]'} ${className}`}
            style={estilos[variante]}
            {...props}
        >
            {Icono && <Icono size={pequeno ? 13 : 15} />}
            {children}
        </button>
    );
};

const estiloEntrada = (c) => ({
    backgroundColor: c.inputBg, color: c.inputText, border: `1px solid ${c.inputBorder}`,
    width: '100%', borderRadius: '8px', padding: '7px 12px', fontSize: '13px', minHeight: '38px'
});

export const Campo = ({ etiqueta, ayuda, children, className = '', obligatorio }) => {
    const c = useColors();
    return (
        <div className={className}>
            {etiqueta && (
                <label className="block mb-1 text-[12px] font-medium" style={{ color: c.textSecondary }}>
                    {etiqueta}{obligatorio && <span style={{ color: MARCA.rojo }}> *</span>}
                </label>
            )}
            {children}
            {ayuda && <p className="text-[11.5px] mt-1" style={{ color: c.textSecondary }}>{ayuda}</p>}
        </div>
    );
};

export const Entrada = ({ className = '', ...props }) => {
    const c = useColors();
    return <input className={`af-campo ${className}`} style={estiloEntrada(c)} {...props} />;
};

export const AreaTexto = ({ className = '', ...props }) => {
    const c = useColors();
    return <textarea rows={2} className={`af-campo ${className}`} style={estiloEntrada(c)} {...props} />;
};

// opciones: [{ value, label }]
export const Selector = ({ opciones = [], vacio, className = '', ...props }) => {
    const c = useColors();
    return (
        <select className={`af-campo ${className}`} style={estiloEntrada(c)} {...props}>
            {vacio !== undefined && <option value="">{vacio}</option>}
            {opciones.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
};

// Etiqueta de estado
export const Insignia = ({ tono = 'gris', children, titulo, punto = false }) => {
    const tonos = useTonos();
    const t = tonos[tono] || tonos.gris;
    return (
        <span title={titulo} className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-md text-[11.5px] font-medium whitespace-nowrap"
            style={{ color: t.text, backgroundColor: t.bg }}>
            {punto && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.fuerte }} />}
            {children}
        </span>
    );
};

export const Aviso = ({ tono = 'azul', children, className = '' }) => {
    const c = useColors();
    const tonos = useTonos();
    const t = tonos[tono] || tonos.azul;
    return (
        <div className={`rounded-lg px-4 py-3 text-[13px] leading-relaxed ${className}`} style={{ backgroundColor: t.bg, color: c.textPrimary }}>
            {children}
        </div>
    );
};

// columnas: [{ clave, titulo, render?(fila), alinear?: 'right' }]
// tonoFila(fila): tiñe la fila según su estado, como en la tabla de la referencia
export const Tabla = ({ columnas, filas, claveFila, alHacerClic, vacio = 'No hay registros.', cargando, tonoFila }) => {
    const c = useColors();
    const tonos = useTonos();
    return (
        <div className="overflow-x-auto rounded-xl px-3 pb-2" style={{ backgroundColor: c.card }}>
            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: tonoFila ? '0 6px' : 0 }}>
                <thead>
                    <tr>
                        {columnas.map(col => (
                            <th key={col.clave} className="px-3 pt-4 pb-2 text-[11.5px] font-medium whitespace-nowrap"
                                style={{ color: c.tableHeaderText, textAlign: col.alinear || 'left' }}>
                                {col.titulo}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filas.map((fila, i) => {
                        const tono = tonoFila ? tonos[tonoFila(fila)] : null;
                        const fondo = tono ? tono.fila : c.tableRow;
                        return (
                            <tr key={claveFila ? fila[claveFila] : i}
                                onClick={alHacerClic ? () => alHacerClic(fila) : undefined}
                                className={alHacerClic ? 'cursor-pointer' : ''}
                                style={{ backgroundColor: fondo }}
                                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.97)'; }}
                                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}>
                                {columnas.map((col, j) => (
                                    <td key={col.clave} className="px-3 py-3 text-[13px] align-middle"
                                        style={{
                                            color: c.textPrimary, textAlign: col.alinear || 'left',
                                            borderTop: !tono && i ? `1px solid ${c.tableBorder}` : 'none',
                                            borderRadius: tono ? (j === 0 ? '10px 0 0 10px' : j === columnas.length - 1 ? '0 10px 10px 0' : 0) : 0
                                        }}>
                                        {col.render ? col.render(fila) : (fila[col.clave] ?? '—')}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {filas.length === 0 && (
                <p className="text-center text-[13px] py-10" style={{ color: c.textSecondary }}>{cargando ? 'Cargando…' : vacio}</p>
            )}
        </div>
    );
};

export const Modal = ({ abierto, titulo, alCerrar, children, pie, ancho = 'max-w-2xl' }) => {
    const c = useColors();
    if (!abierto) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(20,20,26,0.45)' }}>
            <div className={`w-full ${ancho} rounded-2xl my-8 shadow-2xl`} style={{ backgroundColor: c.card }}>
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    <h2 className="text-[18px] font-semibold" style={{ color: c.textPrimary }}>{titulo}</h2>
                    <button onClick={alCerrar} className="af-boton rounded-lg p-1" style={{ color: c.textSecondary }} aria-label="Cerrar"><X size={20} /></button>
                </div>
                <div className="px-6 py-4">{children}</div>
                {pie && <div className="flex flex-wrap justify-end items-center gap-2 px-6 pb-5 pt-2">{pie}</div>}
            </div>
        </div>
    );
};

// Variación contra el período anterior: ↑ 8.2% verde, ↓ 1.2% rojo
export const Tendencia = ({ valor, texto = 'vs. mes pasado', invertir = false }) => {
    const c = useColors();
    if (valor === null || valor === undefined || !Number.isFinite(valor)) return <p className="text-[10.5px] mt-2" style={{ color: c.textSecondary }}>{texto}</p>;
    const bueno = invertir ? valor <= 0 : valor >= 0;
    const Flecha = valor >= 0 ? ArrowUp : ArrowDown;
    return (
        <p className="flex items-center gap-1.5 text-[10.5px] mt-2">
            <span className="flex items-center font-medium" style={{ color: bueno ? MARCA.verde : MARCA.rojo }}><Flecha size={11} strokeWidth={2.5} />{Math.abs(valor)}%</span>
            <span style={{ color: c.textSecondary }}>{texto}</span>
        </p>
    );
};

// Tarjeta de cifra: rótulo e ícono arriba, cifra grande, tendencia o detalle abajo
export const Indicador = ({ etiqueta, valor, detalle, icono: Icono, alerta, onClick, tendencia, textoTendencia, invertir }) => {
    const c = useColors();
    return (
        <div onClick={onClick} className={`rounded-xl px-5 pt-4 pb-4 transition ${onClick ? 'cursor-pointer hover:brightness-[0.98]' : ''}`} style={{ backgroundColor: c.card }}>
            <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium" style={{ color: c.textPrimary }}>{etiqueta}</p>
                {Icono && <Icono size={20} strokeWidth={1.4} style={{ color: alerta ? MARCA.rojo : c.textPrimary }} />}
            </div>
            <p className="text-[28px] font-medium leading-none mt-3 cifras" style={{ color: alerta ? MARCA.rojo : c.textPrimary }}>{valor}</p>
            {tendencia !== undefined
                ? <Tendencia valor={tendencia} texto={textoTendencia} invertir={invertir} />
                : detalle && <p className="text-[10.5px] mt-2" style={{ color: c.textSecondary }}>{detalle}</p>}
        </div>
    );
};

export const Pestanas = ({ pestanas, activa, alCambiar }) => {
    const c = useColors();
    return (
        <div className="flex flex-wrap gap-1.5 mb-5">
            {pestanas.map(p => (
                <button key={p.clave} onClick={() => alCambiar(p.clave)}
                    className="af-boton px-4 h-8 rounded-full text-[12.5px] font-medium transition"
                    style={activa === p.clave ? { backgroundColor: c.menuActivo, color: c.menuActivoTexto } : { color: c.textSecondary, backgroundColor: c.card }}>
                    {p.titulo}
                </button>
            ))}
        </div>
    );
};

export const DatoFicha = ({ etiqueta, valor }) => {
    const c = useColors();
    return (
        <div>
            <p className="text-[11.5px] mb-1" style={{ color: c.textSecondary }}>{etiqueta}</p>
            <div className="text-[15px] font-medium break-words cifras" style={{ color: c.textPrimary }}>{valor ?? '—'}</div>
        </div>
    );
};

// Avance entregado; "plazo" marca cuánto del plazo del contrato ya pasó
export const BarraAvance = ({ porcentaje, plazo, ancho = 'w-36' }) => {
    const c = useColors();
    const atrasado = plazo !== undefined && porcentaje + 10 < plazo;
    return (
        <div className={ancho}>
            <div className="relative h-[6px] rounded-full" style={{ backgroundColor: c.riel }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, porcentaje)}%`, backgroundColor: porcentaje >= 100 ? MARCA.verde : atrasado ? MARCA.ocre : MARCA.azul }} />
                {plazo !== undefined && <div className="absolute -top-[3px] w-[3px] h-3 rounded-full" style={{ left: `calc(${Math.min(100, plazo)}% - 1px)`, backgroundColor: c.textPrimary }} title={`${plazo}% del plazo transcurrido`} />}
            </div>
            <p className="text-[11px] mt-1 cifras" style={{ color: c.textSecondary }}>
                {porcentaje}% entregado{plazo !== undefined && <> · {plazo}% del plazo</>}
            </p>
        </div>
    );
};

// Anillo de progreso pequeño (como "+15%" de la referencia)
export const Anillo = ({ porcentaje, color = MARCA.azul, tamano = 46, texto }) => {
    const c = useColors();
    const r = (tamano - 6) / 2;
    const largo = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(100, porcentaje || 0));
    return (
        <div className="relative shrink-0" style={{ width: tamano, height: tamano }}>
            <svg width={tamano} height={tamano} className="-rotate-90">
                <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" stroke={c.riel} strokeWidth={4} />
                <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${(p / 100) * largo} ${largo}`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold" style={{ color: c.textPrimary }}>{texto ?? `${Math.round(p)}%`}</span>
        </div>
    );
};

// Número de lote
export const CodigoLote = ({ numero, grande = false }) => {
    const c = useColors();
    return <span className={`font-semibold whitespace-nowrap ${grande ? 'text-base' : 'text-[13px]'}`} style={{ color: c.textPrimary }}>{numero}</span>;
};

// Etapas del pedido en miniatura: un segmento por etapa
const ORDEN_ETAPAS = ['pendiente', 'en_preparacion', 'empacado', 'en_transporte', 'entregado'];
export const Etapas = ({ estado, retrasado }) => {
    const c = useColors();
    if (estado === 'anulado') return null;
    const actual = ORDEN_ETAPAS.indexOf(estado);
    const color = estado === 'entregado' ? MARCA.verde : retrasado ? MARCA.rojo : MARCA.azul;
    return (
        <div className="flex gap-1">
            {ORDEN_ETAPAS.map((e, i) => (
                <span key={e} className="h-[5px] w-5 rounded-full" style={{ backgroundColor: i <= actual ? color : c.riel }} />
            ))}
        </div>
    );
};
