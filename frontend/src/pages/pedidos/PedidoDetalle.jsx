import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Truck, ArrowLeft, PackageCheck, ChevronRight, Ban, CheckCircle2, Circle, Wand2, Pencil } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { Pagina, Encabezado, Tarjeta, Tabla, Boton, Modal, Campo, Entrada, AreaTexto, Aviso, DatoFicha, Insignia } from '../../components/ui';
import { useDialogoMotivo, useAvisos } from '../../hooks/useDialogos';
import { InsigniaPedido } from '../../components/insignias';
import { ESTADOS_PEDIDO, ORDEN_PEDIDO, ACCION_SIGUIENTE } from '../../utils/catalogos';
import { formatFecha, formatFechaHora, hoyISO } from '../../utils/fechas';
import { numero, moneda, mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';

const PedidoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const c = useColors();
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

    if (!pedido) return <Pagina><p>Cargando...</p></Pagina>;

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
    const fechaEtapa = (estado) => seguimiento.find(s => s.estado === estado);
    const siguiente = ACCION_SIGUIENTE[pedido.estado];

    return (
        <Pagina>
            {aviso}{dialogo}
            <Encabezado icono={Truck} titulo={`Pedido ${pedido.numero_pedido}`} color="#B85C4A"
                subtitulo={`${pedido.Contrato?.Institucion?.nombre} · Contrato ${pedido.Contrato?.numero_contrato} · NOG ${pedido.Contrato?.nog}`}>
                {puede(usuario, 'pedidos.crear') && pedido.estado === 'pendiente' &&
                    <Boton variante="info" icono={Pencil} onClick={() => { setError(''); setEdicion({ fecha_programada: pedido.fecha_programada, observaciones: pedido.observaciones || '', motivo: '' }); }}>Editar</Boton>}
                {puede(usuario, 'pedidos.anular') && !['entregado', 'anulado'].includes(pedido.estado) && <Boton variante="peligro" icono={Ban} onClick={anular}>Anular</Boton>}
                <Boton variante="secundario" icono={ArrowLeft} onClick={() => navigate('/pedidos')}>Pedidos</Boton>
            </Encabezado>

            {/* Seguimiento: etapas del despacho */}
            <Tarjeta titulo="Seguimiento del despacho">
                {pedido.estado === 'anulado' ? <Aviso tono="gris">Pedido anulado: {seguimiento.find(s => s.estado === 'anulado')?.observacion}</Aviso> : (
                    <div className="flex flex-wrap items-stretch gap-2">
                        {ORDEN_PEDIDO.map((estado, i) => {
                            const etapa = fechaEtapa(estado);
                            const actual = pedido.estado === estado;
                            return (
                                <div key={estado} className="flex items-center gap-2 flex-1 min-w-40">
                                    <div className="flex-1 rounded-xl p-3" style={{ backgroundColor: etapa ? (actual ? '#2B8EA622' : c.inputBg) : 'transparent', border: `1px solid ${actual ? '#2B8EA6' : c.inputBorder}` }}>
                                        <div className="flex items-center gap-1.5">
                                            {etapa ? <CheckCircle2 size={16} style={{ color: '#2B8EA6' }} /> : <Circle size={16} style={{ color: c.textSecondary }} />}
                                            <p className="text-sm font-semibold" style={{ color: c.textPrimary }}>{ESTADOS_PEDIDO[estado].label}</p>
                                        </div>
                                        {etapa && <p className="text-xs mt-1" style={{ color: c.textSecondary }}>{formatFechaHora(etapa.fecha)}<br />{etapa.Usuario?.nombre} {etapa.Usuario?.apellido}</p>}
                                        {etapa?.observacion && <p className="text-xs mt-1 italic" style={{ color: c.textSecondary }}>{etapa.observacion}</p>}
                                    </div>
                                    {i < ORDEN_PEDIDO.length - 1 && <ChevronRight size={16} style={{ color: c.textSecondary }} />}
                                </div>
                            );
                        })}
                    </div>
                )}
                {siguiente && puede(usuario, 'pedidos.despachar') && (
                    <div className="mt-4"><Boton icono={ChevronRight} onClick={() => { setError(''); setAvance({ observacion: '', fecha_entrega: hoyISO() }); }}>{siguiente}</Boton></div>
                )}
            </Tarjeta>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                <DatoFicha etiqueta="Estado" valor={<InsigniaPedido valor={pedido.estado} />} />
                <DatoFicha etiqueta="Fecha del pedido" valor={formatFecha(pedido.fecha_pedido)} />
                <DatoFicha etiqueta="Entrega programada" valor={formatFecha(pedido.fecha_programada)} />
                <DatoFicha etiqueta="Entrega real" valor={pedido.fecha_real_entrega ? formatFecha(pedido.fecha_real_entrega) : '—'} />
                <DatoFicha etiqueta="Retraso" valor={pedido.retrasado ? <Insignia tono="rojo">{pedido.dias_retraso} días</Insignia> : 'A tiempo'} />
                <DatoFicha etiqueta="Monto" valor={moneda(pedido.monto_total)} />
            </div>

            {/* Propuesta FEFO antes de preparar */}
            {pedido.estado === 'pendiente' && propuesta && (
                <Tarjeta titulo="Lotes que se despacharán (FEFO: primero el que vence antes)" icono={Wand2}>
                    <Aviso className="mb-4">El sistema elige los lotes automáticamente. Solo usa lotes disponibles con al menos <b>{propuesta.vigencia_minima_meses} meses</b> de vida útil, como exige el contrato.</Aviso>
                    {propuesta.lineas.map(l => (
                        <div key={l.id_detalle_pedido} className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold" style={{ color: c.textPrimary }}>{l.producto} — {numero(l.cantidad)} unidades</p>
                                {l.faltante > 0 ? <Insignia tono="rojo">Faltan {numero(l.faltante)} aptas</Insignia> : <Insignia tono="verde">Cubierto</Insignia>}
                            </div>
                            <Tabla
                                filas={l.asignaciones}
                                vacio="No hay lotes aptos para este producto."
                                columnas={[
                                    { clave: 'numero_lote', titulo: 'Lote', render: a => <Link className="whitespace-nowrap" to={`/trazabilidad/lote/${a.id_lote}`} style={{ color: '#2B8EA6' }}>{a.numero_lote}</Link> },
                                    { clave: 'laboratorio', titulo: 'Laboratorio' },
                                    { clave: 'fecha_vencimiento', titulo: 'Vencimiento', render: a => `${formatFecha(a.fecha_vencimiento)} (${a.dias_para_vencer} d)` },
                                    { clave: 'disponible', titulo: 'Disponible', alinear: 'right', render: a => numero(a.disponible) },
                                    { clave: 'cantidad', titulo: 'Se tomará', alinear: 'right', render: a => <b>{numero(a.cantidad)}</b> }
                                ]}
                            />
                            {l.excluidos.length > 0 && (
                                <p className="text-xs mt-2" style={{ color: c.textSecondary }}>
                                    Excluidos por vida útil insuficiente: {l.excluidos.map(x => `${x.numero_lote} (vence ${formatFecha(x.fecha_vencimiento)}, ${numero(x.disponible)} unid.)`).join('; ')}
                                </p>
                            )}
                        </div>
                    ))}
                    {puede(usuario, 'pedidos.despachar') && (
                        <Boton icono={PackageCheck} disabled={!propuesta.completo || procesando} onClick={preparar}>
                            {procesando ? 'Procesando...' : 'Confirmar y preparar despacho'}
                        </Boton>
                    )}
                    {!propuesta.completo && <Aviso tono="amarillo" className="mt-3">No hay existencia apta suficiente. Registra un ingreso de compra o ajusta el pedido.</Aviso>}
                </Tarjeta>
            )}

            <Tarjeta titulo="Productos del pedido">
                <Tabla
                    claveFila="id_detalle_pedido"
                    filas={pedido.DetallePedidos || []}
                    columnas={[
                        { clave: 'renglon', titulo: 'Renglón', render: d => d.DetalleContrato?.numero_renglon },
                        { clave: 'producto', titulo: 'Producto', render: d => `${d.Producto?.nombre} ${d.Producto?.concentracion || ''}` },
                        { clave: 'cantidad', titulo: 'Cantidad', alinear: 'right', render: d => numero(d.cantidad) },
                        { clave: 'precio', titulo: 'Precio', alinear: 'right', render: d => moneda(d.precio_unitario) },
                        { clave: 'subtotal', titulo: 'Subtotal', alinear: 'right', render: d => moneda(d.subtotal) },
                        {
                            clave: 'lotes', titulo: 'Lotes despachados', render: d => d.AsignacionLotes?.length
                                ? <div className="space-y-0.5">{d.AsignacionLotes.map(a => (
                                    <div key={a.id_asignacion} className="text-xs">
                                        <Link className="whitespace-nowrap" to={`/trazabilidad/lote/${a.id_lote}`} style={{ color: '#2B8EA6' }}>{a.Lote?.numero_lote}</Link> · {a.Lote?.Laboratorio?.nombre} · vence {formatFecha(a.Lote?.fecha_vencimiento)} · <b>{numero(a.cantidad)}</b>
                                    </div>
                                ))}</div>
                                : <span className="text-xs opacity-60">Se asignan al preparar</span>
                        }
                    ]}
                />
                {pedido.observaciones && <p className="text-sm mt-3" style={{ color: c.textSecondary }}>Observaciones: {pedido.observaciones}</p>}
            </Tarjeta>

            <Modal abierto={!!avance} titulo={siguiente || ''} alCerrar={() => setAvance(null)} ancho="max-w-lg"
                pie={<><Boton variante="secundario" onClick={() => setAvance(null)}>Cancelar</Boton><Boton type="submit" form="form-avance">Confirmar</Boton></>}>
                {avance && (
                    <form id="form-avance" onSubmit={avanzar} className="space-y-4">
                        {pedido.estado === 'en_transporte' && (
                            <Campo etiqueta="Fecha de entrega" obligatorio>
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
