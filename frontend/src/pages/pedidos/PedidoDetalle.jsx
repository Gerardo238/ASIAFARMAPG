import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Truck, ArrowLeft, PackageCheck, ChevronRight, Ban, Wand2, Pencil, Scissors, Building2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useColors, MARCA } from '../../hooks/useColors';
import { Pagina, Tarjeta, Tabla, Boton, Modal, Campo, Entrada, AreaTexto, Aviso, DatoFicha, Insignia, CodigoLote } from '../../components/ui';
import { useTonos } from '../../hooks/useTonos';
import { useDialogoMotivo, useAvisos } from '../../hooks/useDialogos';
import { InsigniaPedido } from '../../components/insignias';
import { ESTADOS_PEDIDO, ORDEN_PEDIDO, ACCION_SIGUIENTE } from '../../utils/catalogos';
import { formatFecha, formatFechaHora, hoyISO } from '../../utils/fechas';
import { numero, moneda, mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';

// Qué sigue en cada etapa y quién lo hace, para que nadie tenga que adivinar
const PASO_SIGUIENTE = {
    pendiente: { quien: 'Bodega', texto: 'Revisa los lotes que propone el sistema (primero el que vence antes) y confirma la preparación. Al confirmar se descuenta el inventario.' },
    en_preparacion: { quien: 'Bodega', texto: 'Separa la mercadería de los lotes asignados y marca el pedido como empacado.' },
    empacado: { quien: 'Bodega', texto: 'Cuando sale el transporte, marca el pedido "En transporte".' },
    en_transporte: { quien: 'Encargado de contratos', texto: 'Cuando la institución confirma que recibió, registra la entrega con la fecha real.' },
    entregado: { quien: null, texto: 'Pedido cerrado. Lo entregado ya cuenta en el avance del contrato.' },
    anulado: { quien: null, texto: 'Pedido anulado. Su cantidad regresó al saldo del contrato.' }
};

// Qué se hace en cada etapa (texto bajo el nombre en el recorrido)
const DESCRIPCION_ETAPA = {
    pendiente: 'El encargado de contratos registra lo que pidió la institución.',
    en_preparacion: 'El sistema asigna los lotes por vencimiento y descuenta la existencia.',
    empacado: 'Bodega separa y empaca la mercadería.',
    en_transporte: 'La mercadería sale de la droguería.',
    entregado: 'La institución recibe; se anota la fecha real.'
};

// Tinte de cada tarjeta del recorrido (como en la referencia, una por etapa)
const TINTES = {
    pendiente: { claro: '#FFF8E4', oscuro: '#4A3F1E' },
    en_preparacion: { claro: '#EEF4FE', oscuro: '#243555' },
    empacado: { claro: '#F5EEFD', oscuro: '#372A4E' },
    en_transporte: { claro: '#EEF4FE', oscuro: '#243555' },
    entregado: { claro: '#EAF6EC', oscuro: '#22402F' }
};

const PedidoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const c = useColors();
    const tonos = useTonos();
    const { usuario } = useAuth();
    const [pedido, setPedido] = useState(null);
    const [propuesta, setPropuesta] = useState(null);
    const [avance, setAvance] = useState(null);
    const [edicion, setEdicion] = useState(null);
    const [error, setError] = useState('');
    const [procesando, setProcesando] = useState(false);
    const [dialogo, pedirMotivo] = useDialogoMotivo();
    const [aviso, mostrar] = useAvisos();

    const cargar = useCallback(() => api.get(`/pedidos/${id}`).then(async ({ data: p }) => {
        const prop = p.estado === 'pendiente' ? (await api.get(`/pedidos/${id}/propuesta`)).data : null;
        setPedido(p);
        setPropuesta(prop);
    }), [id]);
    useEffect(() => { cargar(); }, [cargar]);

    if (!pedido) return <Pagina><p style={{ color: c.textSecondary }}>Cargando…</p></Pagina>;

    const preparar = async () => {
        setProcesando(true);
        try { const r = await api.post(`/pedidos/${id}/preparar`, {}); mostrar(r.data.mensaje); await cargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
        finally { setProcesando(false); }
    };

    const avanzar = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const r = await api.post(`/pedidos/${id}/avanzar`, { observacion: avance.observacion, fecha_entrega: avance.fecha_entrega });
            setAvance(null); mostrar(r.data.mensaje); cargar();
        } catch (err) { setError(mensajeError(err)); }
    };

    const ajustar = async () => {
        const motivo = await pedirMotivo({
            titulo: 'Ajustar el pedido a la existencia apta', confirmar: 'Ajustar pedido',
            mensaje: 'Cada producto se reduce a lo que sí se puede despachar con la vida útil que exige el contrato. Lo que falte regresa al saldo del contrato para pedirlo después. Úsalo si la institución acepta una entrega parcial.'
        });
        if (!motivo) return;
        try { const r = await api.post(`/pedidos/${id}/ajustar`, { motivo }); mostrar(r.data.mensaje); cargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const anular = async () => {
        const motivo = await pedirMotivo({
            titulo: `Anular ${pedido.numero_pedido}`, peligro: true, confirmar: 'Anular pedido',
            mensaje: pedido.estado === 'pendiente' ? 'El pedido quedará anulado y su cantidad vuelve al saldo del contrato.' : 'Los lotes asignados regresarán al inventario y la cantidad vuelve al saldo del contrato.'
        });
        if (!motivo) return;
        try { await api.post(`/pedidos/${id}/anular`, { motivo }); mostrar('Pedido anulado'); cargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const guardarEdicion = async (e) => {
        e.preventDefault();
        setError('');
        try { await api.put(`/pedidos/${id}`, edicion); setEdicion(null); mostrar('Pedido actualizado'); cargar(); }
        catch (err) { setError(mensajeError(err)); }
    };

    const seguimiento = pedido.SeguimientoPedidos || [];
    // La última vez que el pedido pasó por cada etapa
    const etapa = (estado) => [...seguimiento].reverse().find(s => s.estado === estado);
    const siguiente = ACCION_SIGUIENTE[pedido.estado];
    const puedeAvanzar = puede(usuario, pedido.estado === 'en_transporte' ? 'pedidos.entregar' : 'pedidos.despachar');
    const paso = PASO_SIGUIENTE[pedido.estado];
    const indiceActual = ORDEN_PEDIDO.indexOf(pedido.estado);
    const lineas = (pedido.DetallePedidos || []).filter(d => Number(d.cantidad) > 0);
    const unidades = lineas.reduce((s, d) => s + Number(d.cantidad), 0);
    const puedeEditar = puede(usuario, 'pedidos.crear') && pedido.estado === 'pendiente';
    const puedeAnular = puede(usuario, 'pedidos.anular') && !['entregado', 'anulado'].includes(pedido.estado);

    return (
        <Pagina>
            {aviso}{dialogo}

            <button onClick={() => navigate('/pedidos')} className="af-boton flex items-center gap-1.5 text-[13px] mb-4 hover:underline" style={{ color: c.textSecondary }}>
                <ArrowLeft size={15} />Pedidos
            </button>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-x-5">
                {/* Ficha del pedido */}
                <Tarjeta className="xl:col-span-2">
                    <div className="pt-5 flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="flex items-center gap-1.5 text-[11px] tracking-[0.14em]" style={{ color: c.acento }}><Truck size={13} />Pedido</p>
                            <h1 className=" font-semibold text-[28px] leading-tight mt-1" style={{ color: c.textPrimary }}>{pedido.numero_pedido}</h1>
                            <p className="flex items-center gap-1.5 text-[15px] mt-1" style={{ color: c.textPrimary }}>
                                <Building2 size={15} style={{ color: c.textSecondary }} />{pedido.Contrato?.Institucion?.nombre}
                            </p>
                            <p className="text-[13px] mt-0.5" style={{ color: c.textSecondary }}>
                                Contrato <Link to={`/contratos/${pedido.Contrato?.id_contrato}`} className=" hover:underline" style={{ color: c.acento }}>{pedido.Contrato?.numero_contrato}</Link> · NOG <span className="">{pedido.Contrato?.nog}</span>
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <InsigniaPedido valor={pedido.estado} />
                            {pedido.retrasado && pedido.estado !== 'entregado' && <Insignia tono="rojo">{pedido.dias_retraso} d de retraso</Insignia>}
                            {pedido.estado === 'entregado' && <Insignia tono={pedido.retrasado ? 'rojo' : 'verde'}>{pedido.retrasado ? `Llegó ${pedido.dias_retraso} d tarde` : 'Entregado a tiempo'}</Insignia>}
                            {pedido.entrega_proxima && <Insignia tono="amarillo">{pedido.dias_para_entrega === 0 ? 'Se entrega hoy' : `Entrega en ${pedido.dias_para_entrega} d`}</Insignia>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-x-5 gap-y-3 mt-5">
                        <DatoFicha etiqueta="Pedido el" valor={formatFecha(pedido.fecha_pedido)} />
                        <DatoFicha etiqueta="Entrega programada" valor={formatFecha(pedido.fecha_programada)} />
                        <DatoFicha etiqueta="Entrega real" valor={pedido.fecha_real_entrega ? formatFecha(pedido.fecha_real_entrega) : '—'} />
                        <DatoFicha etiqueta="Unidades" valor={numero(unidades)} />
                        <DatoFicha etiqueta="Monto" valor={moneda(pedido.monto_total)} />
                    </div>
                    {pedido.observaciones && <p className="text-[13px] mt-4 italic" style={{ color: c.textSecondary }}>“{pedido.observaciones}”</p>}
                </Tarjeta>

                {/* Siguiente paso: el bloque de color concentra la acción principal */}
                <Tarjeta variante="tinta" titulo={pedido.estado === 'entregado' || pedido.estado === 'anulado' ? 'Pedido cerrado' : 'Siguiente paso'}>
                    {paso.quien && <p className=" text-[10.5px] tracking-[0.14em] mb-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>Le toca a: {paso.quien}</p>}
                    <p className="text-[14px] leading-relaxed" style={{ color: '#FFFFFF' }}>{paso.texto}</p>
                    <div className="mt-5 flex flex-col gap-2">
                        {pedido.estado === 'pendiente' && propuesta && puede(usuario, 'pedidos.despachar') && (
                            <Boton variante="claro" icono={PackageCheck} disabled={!propuesta.completo || procesando} onClick={preparar}>
                                {procesando ? 'Procesando…' : 'Confirmar y preparar despacho'}
                            </Boton>
                        )}
                        {siguiente && puedeAvanzar && (
                            <Boton variante="claro" icono={ChevronRight} onClick={() => { setError(''); setAvance({ observacion: '', fecha_entrega: hoyISO() }); }}>{siguiente}</Boton>
                        )}
                        {(puedeEditar || puedeAnular) && (
                            <div className="flex gap-2 mt-1">
                                {puedeEditar && <button onClick={() => { setError(''); setEdicion({ fecha_programada: pedido.fecha_programada, observaciones: pedido.observaciones || '', motivo: '' }); }}
                                    className="af-boton flex-1 flex items-center justify-center gap-1.5 h-9 rounded-[7px] text-[13px] text-white/85 hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.25)' }}><Pencil size={14} />Editar</button>}
                                {puedeAnular && <button onClick={anular}
                                    className="af-boton flex-1 flex items-center justify-center gap-1.5 h-9 rounded-[7px] text-[13px] hover:bg-white/10" style={{ border: '1px solid rgba(243,181,174,0.45)', color: 'rgba(255,255,255,0.8)' }}><Ban size={14} />Anular</button>}
                            </div>
                        )}
                    </div>
                </Tarjeta>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-x-5">
                {/* Recorrido del despacho: línea vertical con una tarjeta por etapa */}
                <Tarjeta titulo="Recorrido del despacho" nota="Quién movió el pedido de etapa y cuándo" className="xl:col-span-2">
                    {pedido.estado === 'anulado' && <Aviso tono="gris" className="mb-4">Anulado: {etapa('anulado')?.observacion} · {formatFechaHora(etapa('anulado')?.fecha)}</Aviso>}
                    <ol className="relative">
                        {ORDEN_PEDIDO.map((estado, i) => {
                            const e = etapa(estado);
                            const hecha = !!e && (pedido.estado === 'anulado' || i <= indiceActual);
                            const actual = estado === pedido.estado;
                            const ultima = i === ORDEN_PEDIDO.length - 1;
                            const tinte = TINTES[estado][c.darkMode ? 'oscuro' : 'claro'];
                            const colorNodo = estado === 'entregado' && hecha ? MARCA.verde : c.tinta;
                            return (
                                <li key={estado} className="relative flex gap-4 pb-3 last:pb-0">
                                    <div className="relative flex flex-col items-center w-6 shrink-0">
                                        <span className="mt-5 w-[18px] h-[18px] rounded-full z-10"
                                            style={{ backgroundColor: hecha ? colorNodo : c.card, border: `2px solid ${hecha || actual ? colorNodo : c.inputBorder}`, boxShadow: actual ? `0 0 0 4px ${c.darkMode ? '#2A3042' : '#E3E7F3'}` : 'none' }} />
                                        {!ultima && <span className="absolute top-[38px] -bottom-1 w-[2px]" style={{ backgroundColor: i < indiceActual && pedido.estado !== 'anulado' ? c.tinta : c.inputBorder }} />}
                                    </div>
                                    <div className="flex-1 rounded-[10px] px-4 py-3.5" style={{ backgroundColor: hecha ? tinte : 'transparent', border: hecha ? '1px solid transparent' : `1px dashed ${c.inputBorder}` }}>
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="font-medium text-[14.5px]" style={{ color: hecha ? c.textPrimary : c.textSecondary }}>{ESTADOS_PEDIDO[estado].label}</p>
                                                <p className="text-[12.5px] mt-0.5" style={{ color: c.textSecondary }}>{DESCRIPCION_ETAPA[estado]}</p>
                                            </div>
                                            {hecha
                                                ? <Insignia tono={actual && estado !== 'entregado' ? 'azul' : 'verde'}>{actual && estado !== 'entregado' ? 'Aquí va' : 'Hecho'}</Insignia>
                                                : <span className=" text-[10.5px]" style={{ color: c.textSecondary }}>Pendiente</span>}
                                        </div>
                                        {e && hecha && (
                                            <p className="text-[12.5px] mt-2" style={{ color: c.textPrimary }}>
                                                {formatFechaHora(e.fecha)} · <span className="font-sans">{e.Usuario?.nombre} {e.Usuario?.apellido}</span>
                                            </p>
                                        )}
                                        {e?.observacion && hecha && <p className="text-[12.5px] mt-1 italic" style={{ color: c.textSecondary }}>{e.observacion}</p>}
                                        {estado === 'entregado' && !hecha && <p className="text-[12.5px] mt-2" style={{ color: c.textSecondary }}>Programado para el <span className="">{formatFecha(pedido.fecha_programada)}</span></p>}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </Tarjeta>

                {/* Lo que lleva el pedido, con sus lotes */}
                <Tarjeta titulo="Contenido" nota={`${lineas.length} producto(s) · ${numero(unidades)} unidades`}>
                    <div className="space-y-3">
                        {lineas.map(d => (
                            <div key={d.id_detalle_pedido} className="pb-3" style={{ borderBottom: `1px dashed ${c.tableBorder}` }}>
                                <div className="flex justify-between gap-2">
                                    <p className="text-[14px] font-medium" style={{ color: c.textPrimary }}>{d.Producto?.nombre} <span className="font-normal" style={{ color: c.textSecondary }}>{d.Producto?.concentracion}</span></p>
                                    <p className=" text-[13px] font-medium shrink-0" style={{ color: c.textPrimary }}>{numero(d.cantidad)}</p>
                                </div>
                                <p className="text-[12px]" style={{ color: c.textSecondary }}>Renglón {d.DetalleContrato?.numero_renglon} · {moneda(d.precio_unitario)} c/u · {moneda(d.subtotal)}</p>
                                {d.AsignacionLotes?.length > 0
                                    ? <div className="mt-2 space-y-1">
                                        {d.AsignacionLotes.map(a => (
                                            <Link key={a.id_asignacion} to={`/trazabilidad/lote/${a.id_lote}`} className="flex items-center justify-between gap-2 rounded-[5px] px-2 py-1 hover:brightness-95" style={{ backgroundColor: c.suave }}>
                                                <CodigoLote numero={a.Lote?.numero_lote} />
                                                <span className=" text-[11.5px]" style={{ color: c.textSecondary }}>EXP {formatFecha(a.Lote?.fecha_vencimiento)} · <b style={{ color: c.textPrimary }}>{numero(a.cantidad)}</b></span>
                                            </Link>
                                        ))}
                                    </div>
                                    : <p className="text-[12px] mt-1.5 italic" style={{ color: c.textSecondary }}>Los lotes se asignan al preparar.</p>}
                            </div>
                        ))}
                    </div>
                </Tarjeta>
            </div>

            {/* Propuesta FEFO antes de preparar */}
            {pedido.estado === 'pendiente' && propuesta && (
                <Tarjeta titulo="Lotes que se despacharán" icono={Wand2}
                    nota={`El sistema toma primero el lote que vence antes y solo usa lotes con al menos ${propuesta.vigencia_minima_meses} meses de vida útil, como exige el contrato.`}>
                    <div className="space-y-5">
                        {propuesta.lineas.filter(l => l.cantidad > 0).map(l => (
                            <div key={l.id_detalle_pedido}>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <p className="font-medium" style={{ color: c.textPrimary }}>{l.producto} <span className=" text-[13px]" style={{ color: c.textSecondary }}>· {numero(l.cantidad)} unid.</span></p>
                                    {l.faltante > 0 ? <Insignia tono="rojo">Faltan {numero(l.faltante)} aptas</Insignia> : <Insignia tono="verde">Cubierto</Insignia>}
                                </div>
                                <Tabla
                                    filas={l.asignaciones}
                                    vacio="No hay lotes aptos para este producto."
                                    columnas={[
                                        { clave: 'numero_lote', titulo: 'Lote', render: a => <Link to={`/trazabilidad/lote/${a.id_lote}`}><CodigoLote numero={a.numero_lote} /></Link> },
                                        { clave: 'laboratorio', titulo: 'Laboratorio' },
                                        { clave: 'fecha_vencimiento', titulo: 'Vence', render: a => <span className=" text-[13px]">{formatFecha(a.fecha_vencimiento)} <span style={{ color: c.textSecondary }}>({a.dias_para_vencer} d)</span></span> },
                                        { clave: 'disponible', titulo: 'Disponible', alinear: 'right', render: a => numero(a.disponible) },
                                        { clave: 'cantidad', titulo: 'Se tomará', alinear: 'right', render: a => <b>{numero(a.cantidad)}</b> }
                                    ]}
                                />
                                {l.excluidos.length > 0 && (
                                    <p className="text-xs mt-2" style={{ color: c.textSecondary }}>
                                        No se usan por vida útil insuficiente: {l.excluidos.map(x => `${x.numero_lote} (vence ${formatFecha(x.fecha_vencimiento)}, ${numero(x.disponible)} unid.)`).join('; ')}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    {!propuesta.completo && (
                        <div className="mt-5 rounded-[8px] p-4" style={{ backgroundColor: tonos.amarillo.bg, borderLeft: `3px solid ${tonos.amarillo.text}` }}>
                            <p className="text-sm font-medium" style={{ color: c.textPrimary }}>No hay existencia apta para despachar todo. Nunca se descuenta lo que no existe.</p>
                            <p className="text-sm mt-1" style={{ color: c.textSecondary }}>Espera un ingreso de compra del producto que falta, o ajusta el pedido a lo disponible y pide el resto después si la institución acepta una entrega parcial.</p>
                            {puede(usuario, 'pedidos.ajustar') && <Boton className="mt-3" variante="secundario" icono={Scissors} onClick={ajustar}>Ajustar el pedido a lo disponible</Boton>}
                        </div>
                    )}
                </Tarjeta>
            )}

            <Modal abierto={!!avance} titulo={siguiente || ''} alCerrar={() => setAvance(null)} ancho="max-w-lg"
                pie={<><Boton variante="secundario" onClick={() => setAvance(null)}>Cancelar</Boton><Boton type="submit" form="form-avance">Confirmar</Boton></>}>
                {avance && (
                    <form id="form-avance" onSubmit={avanzar} className="space-y-4">
                        {pedido.estado === 'en_transporte' && (
                            <Campo etiqueta="Fecha en que la institución recibió" obligatorio ayuda={`Programada para el ${formatFecha(pedido.fecha_programada)}. Si es posterior, el sistema calcula los días de retraso.`}>
                                <Entrada type="date" required max={hoyISO()} min={pedido.fecha_pedido} value={avance.fecha_entrega} onChange={e => setAvance({ ...avance, fecha_entrega: e.target.value })} />
                            </Campo>
                        )}
                        <Campo etiqueta="Observación" ayuda="Ej. guía de transporte, quién recibió, número de acta.">
                            <AreaTexto value={avance.observacion} onChange={e => setAvance({ ...avance, observacion: e.target.value })} />
                        </Campo>
                        {error && <Aviso tono="rojo">{error}</Aviso>}
                    </form>
                )}
            </Modal>

            <Modal abierto={!!edicion} titulo="Editar pedido" alCerrar={() => setEdicion(null)} ancho="max-w-lg"
                pie={<><Boton variante="secundario" onClick={() => setEdicion(null)}>Cancelar</Boton><Boton type="submit" form="form-edicion">Guardar</Boton></>}>
                {edicion && (
                    <form id="form-edicion" onSubmit={guardarEdicion} className="space-y-4">
                        <Campo etiqueta="Fecha programada"><Entrada type="date" min={hoyISO()} max={pedido.Contrato?.fecha_fin} value={edicion.fecha_programada} onChange={e => setEdicion({ ...edicion, fecha_programada: e.target.value })} /></Campo>
                        <Campo etiqueta="Observaciones"><AreaTexto value={edicion.observaciones} onChange={e => setEdicion({ ...edicion, observaciones: e.target.value })} /></Campo>
                        <Campo etiqueta="Motivo del cambio" ayuda="Obligatorio si cambias la fecha programada."><AreaTexto value={edicion.motivo} onChange={e => setEdicion({ ...edicion, motivo: e.target.value })} /></Campo>
                        {error && <Aviso tono="rojo">{error}</Aviso>}
                    </form>
                )}
            </Modal>
        </Pagina>
    );
};

export default PedidoDetalle;
