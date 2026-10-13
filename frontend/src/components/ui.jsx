// Componentes de interfaz compartidos por todas las pantallas, para que el
// sistema se vea y se comporte igual en todos los módulos.
import { X, Inbox } from 'lucide-react';
import { useColors } from '../hooks/useColors';

const TONOS = {
    verde: { bg: '#D1FAE5', text: '#065F46' },
    amarillo: { bg: '#FEF3C7', text: '#92400E' },
    rojo: { bg: '#FEE2E2', text: '#991B1B' },
    azul: { bg: '#DBEAFE', text: '#1E40AF' },
    morado: { bg: '#EDE9FE', text: '#5B21B6' },
    gris: { bg: '#E5E7EB', text: '#374151' }
};

export const Pagina = ({ children }) => {
    const c = useColors();
    return <div className="p-6 lg:p-8 min-h-screen" style={{ backgroundColor: c.bg }}>{children}</div>;
};

export const Encabezado = ({ icono: Icono, titulo, subtitulo, color = '#1F2D6E', children }) => {
    const c = useColors();
    return (
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div className="flex items-center gap-3">
                {Icono && (
                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}18` }}>
                        <Icono size={24} style={{ color }} />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: c.textPrimary }}>{titulo}</h1>
                    {subtitulo && <p className="text-sm mt-0.5" style={{ color: c.textSecondary }}>{subtitulo}</p>}
                </div>
            </div>
            {children && <div className="flex flex-wrap gap-2">{children}</div>}
        </div>
    );
};

export const Tarjeta = ({ titulo, icono: Icono, acciones, children, className = '', sinPadding = false }) => {
    const c = useColors();
    return (
        <div className={`rounded-xl shadow-sm mb-6 ${className}`} style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
            {(titulo || acciones) && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2">
                        {Icono && <Icono size={18} style={{ color: '#2B8EA6' }} />}
                        <h2 className="text-lg font-bold" style={{ color: c.textPrimary }}>{titulo}</h2>
                    </div>
                    {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
                </div>
            )}
            <div className={sinPadding ? '' : 'px-5 pb-5'}>{children}</div>
        </div>
    );
};

export const Boton = ({ variante = 'primario', icono: Icono, children, className = '', pequeno = false, ...props }) => {
    const c = useColors();
    const estilos = {
        primario: { backgroundColor: c.btnPrimary, color: '#FFFFFF' },
        secundario: { backgroundColor: c.inputBg, color: c.textPrimary, border: `1px solid ${c.inputBorder}` },
        peligro: { backgroundColor: TONOS.rojo.bg, color: TONOS.rojo.text },
        exito: { backgroundColor: TONOS.verde.bg, color: TONOS.verde.text },
        info: { backgroundColor: TONOS.azul.bg, color: TONOS.azul.text },
        acento: { backgroundColor: '#2B8EA6', color: '#FFFFFF' }
    };
    return (
        <button
            type="button"
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${pequeno ? 'px-3 py-1 text-sm' : 'px-4 py-2'} ${className}`}
            style={estilos[variante]}
            {...props}
        >
            {Icono && <Icono size={pequeno ? 14 : 18} />}
            {children}
        </button>
    );
};

const estiloEntrada = (c) => ({
    backgroundColor: c.inputBg, color: c.inputText, border: `1px solid ${c.inputBorder}`,
    width: '100%', borderRadius: '8px', padding: '8px 12px', outline: 'none'
});

export const Campo = ({ etiqueta, ayuda, children, className = '', obligatorio }) => {
    const c = useColors();
    return (
        <div className={className}>
            {etiqueta && (
                <label className="block mb-1 text-sm font-medium" style={{ color: c.textPrimary }}>
                    {etiqueta}{obligatorio && <span style={{ color: '#C4467A' }}> *</span>}
                </label>
            )}
            {children}
            {ayuda && <p className="text-xs mt-1" style={{ color: c.textSecondary }}>{ayuda}</p>}
        </div>
    );
};

export const Entrada = (props) => {
    const c = useColors();
    return <input style={estiloEntrada(c)} {...props} />;
};

export const AreaTexto = (props) => {
    const c = useColors();
    return <textarea rows={2} style={estiloEntrada(c)} {...props} />;
};

// opciones: [{ value, label }]
export const Selector = ({ opciones = [], vacio, ...props }) => {
    const c = useColors();
    return (
        <select style={estiloEntrada(c)} {...props}>
            {vacio !== undefined && <option value="">{vacio}</option>}
            {opciones.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
};

export const Insignia = ({ tono = 'gris', children, titulo }) => (
    <span title={titulo} className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
        style={{ backgroundColor: TONOS[tono]?.bg, color: TONOS[tono]?.text }}>
        {children}
    </span>
);

export const Aviso = ({ tono = 'azul', children, className = '' }) => (
    <div className={`rounded-lg px-4 py-3 text-sm ${className}`} style={{ backgroundColor: TONOS[tono].bg, color: TONOS[tono].text }}>
        {children}
    </div>
);

// columnas: [{ clave, titulo, render?(fila), alinear?: 'right' }]
export const Tabla = ({ columnas, filas, claveFila, alHacerClic, vacio = 'No hay registros.', cargando }) => {
    const c = useColors();
    return (
        <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${c.cardBorder}` }}>
            <table className="w-full">
                <thead>
                    <tr style={{ backgroundColor: c.tableHeader }}>
                        {columnas.map(col => (
                            <th key={col.clave} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                                style={{ color: c.tableHeaderText, textAlign: col.alinear || 'left' }}>
                                {col.titulo}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filas.map((fila, i) => (
                        <tr key={claveFila ? fila[claveFila] : i}
                            onClick={alHacerClic ? () => alHacerClic(fila) : undefined}
                            className={alHacerClic ? 'cursor-pointer' : ''}
                            style={{ backgroundColor: c.tableRow, borderBottom: `1px solid ${c.tableBorder}` }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = c.tableRowHover; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = c.tableRow; }}>
                            {columnas.map(col => (
                                <td key={col.clave} className="px-4 py-3 text-sm" style={{ color: c.textPrimary, textAlign: col.alinear || 'left' }}>
                                    {col.render ? col.render(fila) : (fila[col.clave] ?? '—')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {filas.length === 0 && (
                <div className="text-center py-10" style={{ backgroundColor: c.card }}>
                    <Inbox size={36} className="mx-auto mb-2 opacity-30" style={{ color: c.textSecondary }} />
                    <p className="text-sm" style={{ color: c.textSecondary }}>{cargando ? 'Cargando...' : vacio}</p>
                </div>
            )}
        </div>
    );
};

export const Modal = ({ abierto, titulo, alCerrar, children, pie, ancho = 'max-w-2xl' }) => {
    const c = useColors();
    if (!abierto) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(15,23,42,0.55)' }}>
            <div className={`w-full ${ancho} rounded-xl shadow-xl my-8`} style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${c.tableBorder}` }}>
                    <h2 className="text-lg font-bold" style={{ color: c.textPrimary }}>{titulo}</h2>
                    <button onClick={alCerrar} style={{ color: c.textSecondary }} aria-label="Cerrar"><X size={20} /></button>
                </div>
                <div className="px-6 py-5">{children}</div>
                {pie && <div className="flex flex-wrap justify-end gap-2 px-6 py-4" style={{ borderTop: `1px solid ${c.tableBorder}` }}>{pie}</div>}
            </div>
        </div>
    );
};

export const Indicador = ({ etiqueta, valor, detalle, icono: Icono, color = '#1F2D6E', alerta, onClick }) => {
    const c = useColors();
    return (
        <div onClick={onClick} className={`rounded-2xl p-5 shadow-sm ${onClick ? 'cursor-pointer' : ''}`}
            style={{ backgroundColor: c.card, border: `1px solid ${alerta ? '#FCA5A5' : c.cardBorder}` }}>
            <div className="flex items-center justify-between mb-3">
                {Icono && (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
                        <Icono size={20} style={{ color }} />
                    </div>
                )}
            </div>
            <p className="text-3xl font-bold" style={{ color: alerta ? '#991B1B' : c.textPrimary }}>{valor}</p>
            <p className="text-sm font-medium mt-1" style={{ color: c.textPrimary }}>{etiqueta}</p>
            {detalle && <p className="text-xs mt-0.5" style={{ color: c.textSecondary }}>{detalle}</p>}
        </div>
    );
};

export const Pestanas = ({ pestanas, activa, alCambiar }) => {
    const c = useColors();
    return (
        <div className="flex flex-wrap gap-1 mb-4 p-1 rounded-xl" style={{ backgroundColor: c.inputBg }}>
            {pestanas.map(p => (
                <button key={p.clave} onClick={() => alCambiar(p.clave)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition"
                    style={activa === p.clave ? { backgroundColor: c.btnPrimary, color: '#FFFFFF' } : { color: c.textSecondary }}>
                    {p.titulo}
                </button>
            ))}
        </div>
    );
};

export const DatoFicha = ({ etiqueta, valor }) => {
    const c = useColors();
    return (
        <div className="rounded-xl p-3" style={{ backgroundColor: c.inputBg }}>
            <p className="text-xs font-medium mb-0.5" style={{ color: c.textSecondary }}>{etiqueta}</p>
            <div className="text-sm font-semibold break-words" style={{ color: c.textPrimary }}>{valor ?? '—'}</div>
        </div>
    );
};

export const BarraAvance = ({ porcentaje }) => {
    const c = useColors();
    return (
        <div className="w-28">
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: c.inputBorder }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, porcentaje)}%`, backgroundColor: porcentaje >= 100 ? '#059669' : '#2B8EA6' }} />
            </div>
            <p className="text-xs mt-0.5" style={{ color: c.textSecondary }}>{porcentaje}% entregado</p>
        </div>
    );
};
