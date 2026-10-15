import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ScanLine, ChevronDown, X, CalendarDays } from 'lucide-react';
import api from '../../services/api';
import { useLista, useCatalogo } from '../../hooks/useCatalogo';
import { useColors, MARCA } from '../../hooks/useColors';
import { Pagina, Encabezado, Tabla } from '../../components/ui';
import { InsigniaSemaforo, InsigniaCondicion } from '../../components/insignias';
import { formatFecha } from '../../utils/fechas';
import { numero } from '../../utils/formato';

const VACIO = { texto: '', id_laboratorio: '', id_producto: '', id_proveedor: '', id_institucion: '', desde: '', hasta: '' };

// Filtro compacto en forma de píldora; se resalta cuando tiene un valor elegido
const FiltroPildora = ({ etiqueta, value, onChange, opciones }) => {
    const c = useColors();
    const activo = !!value;
    return (
        <label className="relative inline-flex items-center h-8 rounded-full pl-3.5 pr-8 text-[12.5px] font-medium cursor-pointer"
            style={activo ? { backgroundColor: c.menuActivo, color: c.menuActivoTexto } : { backgroundColor: c.card, color: c.textPrimary }}>
            <span className="whitespace-nowrap max-w-[220px] truncate">{activo ? opciones.find(o => String(o.value) === String(value))?.label : etiqueta}</span>
            <ChevronDown size={14} className="absolute right-3 pointer-events-none" style={{ color: c.textSecondary }} />
            <select value={value} onChange={onChange} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={etiqueta}>
                <option value="">{etiqueta}: todos</option>
                {opciones.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </label>
    );
};

const Trazabilidad = () => {
    const c = useColors();
    const navigate = useNavigate();
    const { datos: laboratorios } = useCatalogo('laboratorios');
    const { datos: proveedores } = useCatalogo('proveedores');
    const { datos: productos } = useLista('/productos');
    const { datos: instituciones } = useLista('/instituciones');
    // Desde el buscador del panel se llega con ?numero_lote=...
    const [url] = useSearchParams();
    const [filtros, setFiltros] = useState(() => ({ ...VACIO, texto: url.get('numero_lote') || '' }));
    const [resultados, setResultados] = useState(null);
    const peticion = useRef(0);

    // Busca mientras se escribe o se cambia un filtro (sin botón)
    useEffect(() => {
        const n = ++peticion.current;
        const t = setTimeout(() => {
            const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
            api.get('/trazabilidad/buscar', { params }).then(r => { if (n === peticion.current) setResultados(r.data); });
        }, 250);
        return () => clearTimeout(t);
    }, [filtros]);

    const poner = (campo) => ({ value: filtros[campo], onChange: e => setFiltros({ ...filtros, [campo]: e.target.value }) });
    const hayFiltros = Object.entries(filtros).some(([k, v]) => k !== 'texto' && v);
    const estiloFecha = { backgroundColor: 'transparent', color: c.textPrimary, colorScheme: c.darkMode ? 'dark' : 'light' };

    return (
        <Pagina>
            <Encabezado titulo="Trazabilidad"
                subtitulo="De dónde vino cada lote (laboratorio, proveedor, factura) y a quién se entregó (institución, contrato, pedido)." />

            {/* Un solo buscador para todo */}
            <div className="flex items-center gap-3 h-12 px-4 rounded-xl mb-3" style={{ backgroundColor: c.card }}>
                <Search size={18} style={{ color: c.textSecondary }} />
                <input autoFocus value={filtros.texto} onChange={e => setFiltros({ ...filtros, texto: e.target.value })}
                    placeholder="Busca un lote, producto, laboratorio, proveedor, factura o institución…"
                    className="flex-1 bg-transparent outline-none text-[14px]" style={{ color: c.textPrimary }} />
                {filtros.texto
                    ? <button onClick={() => setFiltros({ ...filtros, texto: '' })} aria-label="Borrar búsqueda"><X size={16} style={{ color: c.textSecondary }} /></button>
                    : <span className="flex items-center gap-1 text-[11px]" style={{ color: c.textSecondary }}><ScanLine size={15} />Acepta lector</span>}
            </div>

            {/* Filtros finos, compactos en una línea */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
                <FiltroPildora etiqueta="Laboratorio" {...poner('id_laboratorio')} opciones={laboratorios.map(l => ({ value: l.id_laboratorio, label: l.nombre }))} />
                <FiltroPildora etiqueta="Producto" {...poner('id_producto')} opciones={productos.map(p => ({ value: p.id_producto, label: `${p.nombre} ${p.concentracion || ''}`.trim() }))} />
                <FiltroPildora etiqueta="Proveedor" {...poner('id_proveedor')} opciones={proveedores.map(p => ({ value: p.id_proveedor, label: p.nombre }))} />
                <FiltroPildora etiqueta="Entregado a" {...poner('id_institucion')} opciones={instituciones.map(i => ({ value: i.id_institucion, label: i.nombre }))} />
                <span className="inline-flex items-center gap-1.5 h-8 rounded-full px-3.5 text-[12.5px]"
                    style={filtros.desde || filtros.hasta ? { backgroundColor: c.menuActivo, color: c.menuActivoTexto } : { backgroundColor: c.card, color: c.textPrimary }}>
                    <CalendarDays size={14} style={{ color: c.textSecondary }} />Comprado entre
                    <input type="date" {...poner('desde')} className="bg-transparent outline-none text-[12px] w-[112px]" style={estiloFecha} />
                    y
                    <input type="date" {...poner('hasta')} className="bg-transparent outline-none text-[12px] w-[112px]" style={estiloFecha} />
                </span>
                {hayFiltros && (
                    <button onClick={() => setFiltros({ ...VACIO, texto: filtros.texto })} className="h-8 px-2 text-[12.5px] font-medium" style={{ color: MARCA.azul }}>Quitar filtros</button>
                )}
                <span className="ml-auto text-[12.5px]" style={{ color: c.textSecondary }}>
                    {resultados ? `${resultados.length} lote${resultados.length === 1 ? '' : 's'}` : 'Buscando…'}
                </span>
            </div>

            <Tabla
                claveFila="id_lote"
                filas={resultados || []}
                cargando={!resultados}
                alHacerClic={l => navigate(`/trazabilidad/lote/${l.id_lote}`)}
                vacio="Ningún lote coincide. Prueba con menos palabras o quita algún filtro."
                columnas={[
                    {
                        clave: 'lote', titulo: 'Lote', render: l => (
                            <div><p className="font-semibold whitespace-nowrap">{l.numero_lote}</p><p className="text-[11.5px]" style={{ color: c.textSecondary }}>{l.Producto?.nombre} {l.Producto?.concentracion}</p></div>
                        )
                    },
                    {
                        clave: 'origen', titulo: 'De dónde vino', render: l => (
                            <div className="max-w-[260px]"><p className="truncate">{l.Laboratorio?.nombre}</p>
                                <p className="text-[11.5px] truncate" style={{ color: c.textSecondary }}>{l.Ingreso?.Proveedor?.nombre} · Fact. {l.Ingreso?.serie_factura}-{l.Ingreso?.numero_factura} · {formatFecha(l.Ingreso?.fecha_recepcion)}</p></div>
                        )
                    },
                    {
                        clave: 'salidas', titulo: 'Recibido / salió / queda', render: l => {
                            const recibido = Number(l.cantidad_recibida) || 1;
                            return (
                                <div className="w-44">
                                    <div className="flex h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: c.riel }}>
                                        <div style={{ width: `${(l.cantidad_despachada / recibido) * 100}%`, backgroundColor: MARCA.morado }} />
                                        <div style={{ width: `${(Number(l.cantidad_disponible) / recibido) * 100}%`, backgroundColor: MARCA.azul }} />
                                    </div>
                                    <p className="text-[11px] mt-1 whitespace-nowrap" style={{ color: c.textSecondary }}>
                                        {numero(l.cantidad_recibida)} · <span style={{ color: MARCA.morado }}>{numero(l.cantidad_despachada)} salió</span> · <span style={{ color: MARCA.azul }}>{numero(l.cantidad_disponible)} queda</span>
                                    </p>
                                </div>
                            );
                        }
                    },
                    {
                        clave: 'inst', titulo: 'Entregado a', render: l => l.instituciones.length
                            ? <div className="flex flex-wrap gap-1 max-w-[260px]">{l.instituciones.map(i => <span key={i} className="px-2 py-[2px] rounded-md text-[11.5px]" style={{ backgroundColor: c.suave }}>{i}</span>)}</div>
                            : <span className="text-[12px]" style={{ color: c.textSecondary }}>Todavía no sale</span>
                    },
                    { clave: 'venc', titulo: 'Vence', render: l => <div><p className="whitespace-nowrap">{formatFecha(l.fecha_vencimiento)}</p><div className="mt-1"><InsigniaSemaforo semaforo={l.semaforo} /></div></div> },
                    { clave: 'cond', titulo: 'Condición', render: l => <InsigniaCondicion valor={l.condicion} /> }
                ]}
            />
        </Pagina>
    );
};

export default Trazabilidad;
