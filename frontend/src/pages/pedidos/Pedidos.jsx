import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLista } from '../../hooks/useCatalogo';
import { useColors, MARCA } from '../../hooks/useColors';
import { Pagina, Encabezado, Tabla, Boton, Modal, Campo, Entrada, Selector, AreaTexto, Aviso, Etapas } from '../../components/ui';
import { useAvisos } from '../../hooks/useDialogos';
import { ESTADOS_PEDIDO } from '../../utils/catalogos';
import { formatFecha, hoyISO } from '../../utils/fechas';
import { numero, moneda, mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';

// Pestañas de la lista: cada una filtra en pantalla y muestra cuántos hay
const FILTROS = [
    { clave: '', titulo: 'Todos', cumple: () => true },
    { clave: 'proximos', titulo: 'Entrega próxima', cumple: p => p.entrega_proxima, alerta: true },
    { clave: 'retrasados', titulo: 'Retrasados', cumple: p => p.retrasado && p.estado !== 'entregado', alerta: true },
    ...['pendiente', 'en_preparacion', 'empacado', 'en_transporte', 'entregado', 'anulado'].map(e => ({ clave: e, titulo: ESTADOS_PEDIDO[e].label, cumple: p => p.estado === e }))
];

// Tinte de la fila según su situación (como la tabla de la referencia)
const tonoFila = (p) => {
    if (p.estado === 'anulado') return 'gris';
    if (p.retrasado && p.estado !== 'entregado') return 'rojo';
    if (p.entrega_proxima) return 'amarillo';
    if (p.estado === 'entregado') return 'verde';
    return 'azul';
};

// La fecha que importa según la etapa, dicha en palabras
const situacionEntrega = (p) => {
    if (p.estado === 'anulado') return { texto: 'Anulado', color: null };
    if (p.estado === 'entregado') {
        const devuelto = p.unidades_devueltas > 0 ? ` · devolvieron ${numero(p.unidades_devueltas)} u.` : '';
        return p.retrasado
            ? { texto: `Entregado el ${formatFecha(p.fecha_real_entrega)}, ${p.dias_retraso} d hábiles tarde${devuelto}`, color: MARCA.rojo }
            : { texto: `Entregado el ${formatFecha(p.fecha_real_entrega)}, a tiempo${devuelto}`, color: devuelto ? MARCA.ocre : MARCA.verde };
    }
    if (p.retrasado) return { texto: `${p.dias_retraso} d hábiles de retraso`, color: MARCA.rojo };
    if (p.fecha_compromiso) return { texto: `Carta de compromiso: ${formatFecha(p.fecha_compromiso)}`, color: p.entrega_proxima ? '#A16A00' : null };
    if (p.dias_para_entrega === 0) return { texto: 'Se entrega hoy', color: '#A16A00' };
    return { texto: `Faltan ${p.dias_para_entrega} d`, color: p.entrega_proxima ? '#A16A00' : null };
};

const Pedidos = () => {
    const c = useColors();
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    // El filtro vive en la URL para que el panel pueda abrir la lista ya filtrada
    const filtro = params.get('estado') || (params.get('retrasados') ? 'retrasados' : params.get('proximos') ? 'proximos' : '');
    const idInstitucion = params.get('id_institucion') || '';
    const cambiarFiltros = (nuevoFiltro, nuevaInstitucion) => {
        const p = {};
        if (['retrasados', 'proximos'].includes(nuevoFiltro)) p[nuevoFiltro] = '1';
        else if (nuevoFiltro) p.estado = nuevoFiltro;
        if (nuevaInstitucion) p.id_institucion = nuevaInstitucion;
        setParams(p, { replace: true });
    };
    const { datos: todos, recargar, cargando } = useLista('/pedidos');
    const { datos: instituciones } = useLista('/instituciones');
    const { datos: contratos } = useLista('/contratos?estado=vigente');
    const [buscar, setBuscar] = useState('');
    // Desde el detalle de un contrato se llega con ?contrato=ID: el formulario abre con ese contrato
    const [form, setForm] = useState(() => params.get('contrato')
        ? { id_contrato: params.get('contrato'), fecha_programada: '', observaciones: '', cantidades: {} }
        : null);
    const [error, setError] = useState('');
    const [consulta, setConsulta] = useState(null);
    const [aviso, mostrar] = useAvisos();

    const abrir = (idContrato = '') => {
        setError('');
        setForm({ id_contrato: String(idContrato), fecha_programada: '', observaciones: '', cantidades: {} });
    };

    useEffect(() => {
        if (params.get('contrato')) setParams({}, { replace: true });
    }, [params, setParams]);

    // Al elegir el contrato: cuánto hay en bodega para cada renglón y la fecha
    // de entrega que corresponde al plazo de su modalidad
    const idContrato = form?.id_contrato;
    useEffect(() => {
        if (!idContrato) return;
        api.get('/pedidos/disponibilidad', { params: { id_contrato: idContrato } }).then(({ data }) => {
            setConsulta({ id: idContrato, datos: data });
            setForm(f => (f && !f.fecha_programada ? { ...f, fecha_programada: data.fecha_sugerida } : f));
        }).catch(() => setConsulta(null));
    }, [idContrato]);
    // Solo vale la consulta del contrato que está elegido ahora
    const disponibilidad = consulta && consulta.id === idContrato ? consulta.datos : null;

    const contrato = contratos.find(x => String(x.id_contrato) === String(form?.id_contrato));
    const total = contrato ? contrato.renglones.reduce((s, r) => s + (Number(form.cantidades[r.id_detalle_contrato]) || 0) * Number(r.precio_unitario), 0) : 0;
    const dispRenglon = (r) => disponibilidad?.renglones.find(x => x.id_detalle_contrato === r.id_detalle_contrato);
    const maximo = (r) => Math.min(r.saldo_por_pedir, dispRenglon(r)?.disponible ?? r.saldo_por_pedir);
    const fueraDePlazo = disponibilidad && form?.fecha_programada && form.fecha_programada > disponibilidad.fecha_sugerida;

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        const detalles = Object.entries(form.cantidades).filter(([, v]) => Number(v) > 0).map(([id_detalle_contrato, cantidad]) => ({ id_detalle_contrato, cantidad }));
        try {
            const res = await api.post('/pedidos', { id_contrato: form.id_contrato, fecha_programada: form.fecha_programada, observaciones: form.observaciones, detalles });
            setForm(null); mostrar(res.data.advertencia ? `${res.data.mensaje}. ${res.data.advertencia}` : res.data.mensaje, res.data.advertencia ? 'amarillo' : 'verde'); recargar();
            navigate(`/pedidos/${res.data.pedido.id_pedido}`);
        } catch (err) { setError(mensajeError(err)); }
    };

    // Filtro por institución y texto; después las pestañas cuentan sobre ese resultado
    const texto = buscar.trim().toLowerCase();
    const base = todos.filter(p =>
        (!idInstitucion || String(p.Contrato?.Institucion?.id_institucion) === idInstitucion) &&
        (!texto || `${p.numero_pedido} ${p.Contrato?.Institucion?.nombre} ${p.Contrato?.numero_contrato} ${p.Contrato?.nog}`.toLowerCase().includes(texto)));
    const activo = FILTROS.find(f => f.clave === filtro) || FILTROS[0];
    const pedidos = base.filter(activo.cumple);

    return (
        <Pagina>
            {aviso}
            <Encabezado titulo="Pedidos">
                {puede(usuario, 'pedidos.crear') && <Boton icono={Plus} onClick={() => abrir()}>Nuevo pedido</Boton>}
            </Encabezado>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap gap-1.5">
                    {FILTROS.map(f => {
                        const n = base.filter(f.cumple).length;
                        if (f.alerta && !n && filtro !== f.clave) return null;
                        const sel = filtro === f.clave;
                        return (
                            <button key={f.clave || 'todos'} onClick={() => cambiarFiltros(f.clave, idInstitucion)}
                                className="af-boton h-8 px-3.5 rounded-full text-[12.5px] font-medium flex items-center gap-2 transition"
                                style={sel ? { backgroundColor: c.menuActivo, color: c.menuActivoTexto } : { backgroundColor: c.card, color: f.alerta ? MARCA.rojo : c.textPrimary }}>
                                {f.titulo}<span className="text-[11px]" style={{ color: sel ? '#6E6E76' : c.textSecondary }}>{n}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="flex gap-2">
                    <div className="w-56"><Entrada placeholder="Buscar pedido, institución…" value={buscar} onChange={e => setBuscar(e.target.value)} /></div>
                    <div className="w-56"><Selector vacio="Todas las instituciones" value={idInstitucion} onChange={e => cambiarFiltros(filtro, e.target.value)} opciones={instituciones.map(i => ({ value: i.id_institucion, label: i.nombre }))} /></div>
                </div>
            </div>

            <Tabla
                claveFila="id_pedido"
                filas={pedidos}
                cargando={cargando}
                tonoFila={tonoFila}
                alHacerClic={p => navigate(`/pedidos/${p.id_pedido}`)}
                vacio="No hay pedidos con este filtro."
                columnas={[
                    {
                        clave: 'numero_pedido', titulo: 'Pedido', render: p => (
                            <div><p className="font-semibold whitespace-nowrap">{p.numero_pedido}</p><p className="text-[11px]" style={{ color: c.textSecondary }}>Pedido el {formatFecha(p.fecha_pedido)}</p></div>
                        )
                    },
                    {
                        clave: 'inst', titulo: 'Institución', render: p => (
                            <div className="max-w-[300px]"><p className="truncate">{p.Contrato?.Institucion?.nombre}</p><p className="text-[11px] truncate" style={{ color: c.textSecondary }}>Contrato {p.Contrato?.numero_contrato} · NOG {p.Contrato?.nog}</p></div>
                        )
                    },
                    {
                        clave: 'entrega', titulo: 'Entrega programada', render: p => {
                            const s = situacionEntrega(p);
                            return <div><p className="whitespace-nowrap">{formatFecha(p.fecha_programada)}</p><p className="text-[11px] font-medium whitespace-nowrap" style={{ color: s.color || c.textSecondary }}>{s.texto}</p></div>;
                        }
                    },
                    {
                        clave: 'estado', titulo: 'Etapa', render: p => (
                            <div><p className="text-[12.5px] mb-1.5">{ESTADOS_PEDIDO[p.estado]?.label}</p><Etapas estado={p.estado} retrasado={p.retrasado} /></div>
                        )
                    },
                    { clave: 'monto', titulo: 'Monto', alinear: 'right', render: p => <span className="font-semibold whitespace-nowrap">{moneda(p.monto_total)}</span> }
                ]}
            />

            <Modal abierto={!!form} titulo="Nuevo pedido" alCerrar={() => setForm(null)} ancho="max-w-4xl"
                pie={<>
                    <span className="mr-auto self-center text-sm font-medium" style={{ color: c.textPrimary }}>Monto: {moneda(total)}</span>
                    <Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton>
                    <Boton type="submit" form="form-pedido" disabled={!contrato}>Crear pedido</Boton>
                </>}>
                {form && (
                    <form id="form-pedido" onSubmit={guardar} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Campo etiqueta="Contrato vigente" obligatorio className="md:col-span-2">
                                <Selector vacio="Seleccionar contrato" required value={form.id_contrato} onChange={e => setForm({ ...form, id_contrato: e.target.value, cantidades: {} })}
                                    opciones={contratos.map(x => ({ value: x.id_contrato, label: `${x.numero_contrato} · NOG ${x.nog} · ${x.Institucion?.nombre}` }))} />
                            </Campo>
                            <Campo etiqueta="Fecha programada de entrega" obligatorio
                                ayuda={disponibilidad ? `Plazo de ${disponibilidad.modalidad}: ${disponibilidad.plazo_entrega_dias} días hábiles (a más tardar el ${formatFecha(disponibilidad.fecha_sugerida)}).` : undefined}>
                                <Entrada type="date" required min={hoyISO()} max={contrato?.fecha_fin} value={form.fecha_programada} onChange={e => setForm({ ...form, fecha_programada: e.target.value })} />
                            </Campo>
                        </div>
                        {fueraDePlazo && (
                            <Aviso tono="amarillo">La fecha supera el plazo de entrega de la modalidad. Confírmala con la institución: en baja cuantía y compra directa puede anular la orden y adjudicarla al siguiente proveedor.</Aviso>
                        )}
                        {contrato && (
                            <div>
                                <p className="text-sm mb-2" style={{ color: c.textSecondary }}>
                                    Indica cuánto se pide de cada renglón. No puede exceder el saldo del contrato ni lo que hay en bodega
                                    {disponibilidad ? ` con al menos ${disponibilidad.vigencia_minima_meses} meses de vida útil` : ''}, descontando lo ya comprometido en otros pedidos pendientes. Los lotes los asigna el sistema al preparar el pedido.
                                </p>
                                <Tabla
                                    claveFila="id_detalle_contrato"
                                    filas={contrato.renglones}
                                    columnas={[
                                        { clave: 'numero_renglon', titulo: 'Renglón' },
                                        {
                                            clave: 'producto', titulo: 'Producto', render: r => (
                                                <div>
                                                    <p>{r.Producto?.nombre} {r.Producto?.concentracion || ''}</p>
                                                    {dispRenglon(r)?.nota_tecnica && <p className="text-[11px]" style={{ color: MARCA.rojo }}>Nota técnica {dispRenglon(r).nota_tecnica.numero} vigente hasta el {formatFecha(dispRenglon(r).nota_tecnica.hasta)}: la institución lo compra por otra modalidad</p>}
                                                </div>
                                            )
                                        },
                                        { clave: 'saldo', titulo: 'Saldo por pedir', alinear: 'right', render: r => <b>{numero(r.saldo_por_pedir)}</b> },
                                        {
                                            clave: 'bodega', titulo: 'Disponible en bodega', alinear: 'right', render: r => {
                                                const d = dispRenglon(r);
                                                if (!d) return '…';
                                                return (
                                                    <div title={d.comprometida ? `${numero(d.apta)} aptas; ${numero(d.comprometida)} comprometidas en ${d.pedidos.join(', ')}` : `${numero(d.apta)} aptas`}>
                                                        <b style={{ color: d.disponible < r.saldo_por_pedir ? MARCA.rojo : undefined }}>{numero(d.disponible)}</b>
                                                        {d.comprometida > 0 && <p className="text-[11px]" style={{ color: c.textSecondary }}>{numero(d.comprometida)} en pedidos pendientes</p>}
                                                    </div>
                                                );
                                            }
                                        },
                                        { clave: 'precio', titulo: 'Precio', alinear: 'right', render: r => moneda(r.precio_unitario) },
                                        {
                                            clave: 'cantidad', titulo: 'Cantidad a pedir', render: r => (
                                                <div className="w-32">
                                                    <Entrada type="number" min="0" max={maximo(r)} step="any" disabled={maximo(r) <= 0}
                                                        value={form.cantidades[r.id_detalle_contrato] || ''}
                                                        onChange={e => setForm({ ...form, cantidades: { ...form.cantidades, [r.id_detalle_contrato]: e.target.value } })} />
                                                </div>
                                            )
                                        }
                                    ]}
                                />
                            </div>
                        )}
                        {contratos.length === 0 && <Aviso tono="amarillo">No hay contratos vigentes.</Aviso>}
                        <Campo etiqueta="Observaciones"><AreaTexto value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} /></Campo>
                        {error && <Aviso tono="rojo">{error}</Aviso>}
                    </form>
                )}
            </Modal>
        </Pagina>
    );
};

export default Pedidos;
