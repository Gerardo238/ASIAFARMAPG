import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FileText, ArrowLeft, Pencil, Truck, Ban, RotateCcw, XCircle, Gavel, CalendarPlus, FileWarning, ClipboardList, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Pagina, Encabezado, Tarjeta, Tabla, Boton, DatoFicha, Insignia, BarraAvance, Aviso, Modal, Campo, Entrada, AreaTexto, Selector } from '../../components/ui';
import { useDialogoMotivo, useAvisos } from '../../hooks/useDialogos';
import { InsigniaContrato, InsigniaPedido } from '../../components/insignias';
import Adjuntos from '../../components/Adjuntos';
import { useColors } from '../../hooks/useColors';
import { TIPOS_TRAMITE, ESTADOS_TRAMITE } from '../../utils/catalogos';
import { formatFecha, hoyISO } from '../../utils/fechas';
import { numero, moneda, mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';
import FormContrato from './FormContrato';

// Qué se registra en cada trámite y cómo se explica al usuario
const AYUDA_TRAMITE = {
    prorroga: 'El proveedor la solicita por medio de su abogado y representante legal, con documentos que justifiquen el motivo, ANTES de que venza el contrato. Así evita la sanción o que se ejecute la fianza de cumplimiento. Si se aprueba, el contrato termina en la nueva fecha.',
    nota_tecnica: 'Solo en contrato abierto: cuando no se puede abastecer un renglón, se pide una nota técnica (por lo general 30 días) con documentos que lo respalden. Mientras dure, las unidades compran ese producto por baja cuantía o compra directa.',
    oficio: 'Advertencia que la institución envía por atrasos o incumplimientos. Después de 3 oficios puede dejar de comprarnos, salvo en contrato abierto.'
};

const ContratoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const c = useColors();
    const [contrato, setContrato] = useState(null);
    const [causas, setCausas] = useState(null);
    const [editar, setEditar] = useState(false);
    const [tramite, setTramite] = useState(null);
    const [resolucion, setResolucion] = useState(null);
    const [error, setError] = useState('');
    const [dialogo, pedirMotivo] = useDialogoMotivo();
    const [aviso, mostrar] = useAvisos();

    const cargar = useCallback(() => api.get(`/contratos/${id}`).then(r => setContrato(r.data)), [id]);
    useEffect(() => { cargar(); }, [cargar]);
    useEffect(() => { api.get('/tramites/causas').then(r => setCausas(r.data)).catch(() => setCausas(null)); }, []);

    if (!contrato) return <Pagina><p>Cargando...</p></Pagina>;

    const cambiarEstado = async (estado, titulo, mensaje) => {
        const motivo = await pedirMotivo({ titulo, mensaje, peligro: estado !== 'vigente', confirmar: titulo });
        if (!motivo) return;
        try { await api.post(`/contratos/${id}/estado`, { estado, motivo }); mostrar('Estado actualizado'); cargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const abrirTramite = (tipo) => {
        setError('');
        setTramite({ tipo, numero_documento: '', fecha_documento: hoyISO(), causa: '', descripcion: '', fecha_desde: hoyISO(), fecha_hasta: '', id_detalle_contrato: '', id_pedido: '' });
    };

    const guardarTramite = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const r = await api.post('/tramites', { ...tramite, id_contrato: contrato.id_contrato });
            setTramite(null);
            mostrar(r.data.advertencia ? `${r.data.mensaje}. ${r.data.advertencia}` : r.data.mensaje, r.data.advertencia ? 'rojo' : 'verde');
            cargar();
        } catch (err) { setError(mensajeError(err)); }
    };

    const guardarResolucion = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const r = await api.post(`/tramites/${resolucion.id_tramite}/resolver`, resolucion);
            setResolucion(null); mostrar(r.data.mensaje); cargar();
        } catch (err) { setError(mensajeError(err)); }
    };

    const anularTramite = async (t) => {
        const motivo = await pedirMotivo({
            titulo: `Anular ${TIPOS_TRAMITE[t.tipo].label.toLowerCase()} ${t.numero_documento}`, peligro: true, confirmar: 'Anular',
            mensaje: t.tipo === 'prorroga' && t.estado === 'aprobada' ? 'El contrato regresará a su fecha de fin anterior.' : 'El trámite deja de contar, pero queda en la auditoría.'
        });
        if (!motivo) return;
        try { await api.post(`/tramites/${t.id_tramite}/anular`, { motivo }); mostrar('Trámite anulado'); cargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const editable = !['anulado', 'cancelado', 'completado'].includes(contrato.estado);
    const vigente = contrato.estado === 'vigente';
    const tramites = contrato.tramites || [];
    const prorrogaEnTramite = tramites.find(t => t.tipo === 'prorroga' && t.estado === 'solicitada');
    const puedeTramitar = puede(usuario, 'tramites.escribir');
    const opcionesCausa = (tipo) => Object.entries(causas?.[tipo] || {}).map(([value, label]) => ({ value, label }));
    const detalleTramite = (t) => {
        if (t.tipo === 'prorroga') return `Fin ${formatFecha(t.fecha_fin_anterior)} → ${formatFecha(t.fecha_hasta)}`;
        if (t.tipo === 'nota_tecnica') return `Renglón ${t.DetalleContrato?.numero_renglon} (${t.DetalleContrato?.Producto?.nombre}) · ${formatFecha(t.fecha_desde)} al ${formatFecha(t.fecha_hasta)}`;
        return t.Pedido ? `Pedido ${t.Pedido.numero_pedido}` : 'Todo el contrato';
    };

    return (
        <Pagina>
            {aviso}{dialogo}
            <Encabezado icono={FileText} titulo={`Contrato ${contrato.numero_contrato}`} color="#A35CF1" subtitulo={`NOG ${contrato.nog} · ${contrato.Institucion?.nombre}`}>
                {puede(usuario, 'pedidos.crear') && vigente &&
                    <Boton icono={Truck} onClick={() => navigate(`/pedidos?contrato=${contrato.id_contrato}`)}>Nuevo pedido</Boton>}
                {puede(usuario, 'contratos.escribir') && editable && <Boton variante="info" icono={Pencil} onClick={() => setEditar(true)}>Editar</Boton>}
                {puede(usuario, 'contratos.estado') && ['vigente', 'vencido'].includes(contrato.estado) && <>
                    <Boton variante="peligro" icono={XCircle} onClick={() => cambiarEstado('cancelado', 'Cancelar contrato', 'El contrato se da por terminado. Conserva sus entregas.')}>Cancelar</Boton>
                    <Boton variante="peligro" icono={Ban} onClick={() => cambiarEstado('anulado', 'Anular contrato', 'Solo es posible si no tiene entregas. Puede reactivarse después.')}>Anular</Boton>
                </>}
                {puede(usuario, 'contratos.estado') && ['cancelado', 'anulado'].includes(contrato.estado) &&
                    <Boton variante="exito" icono={RotateCcw} onClick={() => cambiarEstado('vigente', 'Reactivar contrato')}>Reactivar</Boton>}
                <Boton variante="secundario" icono={ArrowLeft} onClick={() => navigate('/contratos')}>Contratos</Boton>
            </Encabezado>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-2">
                <DatoFicha etiqueta="Estado" valor={<InsigniaContrato valor={contrato.estado} />} />
                <DatoFicha etiqueta="Modalidad" valor={contrato.ModalidadCompra?.nombre} />
                <DatoFicha etiqueta="Vence" valor={`${formatFecha(contrato.fecha_fin)}${vigente ? ` (${contrato.dias_para_fin} d)` : ''}`} />
                <DatoFicha etiqueta="Monto" valor={moneda(contrato.monto_total)} />
                <DatoFicha etiqueta="Avance" valor={<BarraAvance porcentaje={contrato.porcentaje_avance} />} />
            </div>
            {/* Lo demás, en una línea */}
            <p className="text-[12.5px] mb-6" style={{ color: c.textSecondary }}>
                Desde el {formatFecha(contrato.fecha_inicio)} · Entrega en {contrato.plazo_entrega_dias} días hábiles
                {vigente && <> · Pedir antes del <b>{formatFecha(contrato.ultimo_dia_pedido)}</b></>}
                {' · '}Vida útil mínima {contrato.vigencia_minima_meses ?? 'general'}{contrato.vigencia_minima_meses != null ? ' meses' : ''}
                {contrato.contrato_abierto && ' · Contrato abierto'}
            </p>

            <div className="space-y-3 mb-5">
                {contrato.estado === 'vencido' && (
                    <Aviso tono="rojo">
                        El contrato venció el {formatFecha(contrato.fecha_fin)}: ya no se pueden hacer entregas porque no hay presupuesto habilitado para pagar.
                        {prorrogaEnTramite ? ` La prórroga ${prorrogaEnTramite.numero_documento} se solicitó a tiempo; registra su resolución.` : contrato.tiene_saldo ? (contrato.contrato_abierto ? ' Como es contrato abierto, el saldo no obligaba a la institución.' : ' Si no se renueva, la institución comprará el saldo por otra modalidad.') : ''}
                    </Aviso>
                )}
                {vigente && contrato.tiene_saldo && contrato.dias_para_fin <= 30 && (
                    <Aviso tono="amarillo">
                        Vence en {contrato.dias_para_fin} días con saldo por entregar. Para entregar a tiempo, los pedidos deben llegar a más tardar el {formatFecha(contrato.ultimo_dia_pedido)} ({contrato.plazo_entrega_dias} días hábiles de entrega). Llama a compras de la institución para que envíen sus órdenes{contrato.contrato_abierto ? '' : ' o solicita una prórroga antes del vencimiento'}.
                    </Aviso>
                )}
                {contrato.oficios_institucion >= contrato.limite_oficios - 1 && (
                    <Aviso tono="rojo">
                        {contrato.Institucion?.nombre} ha enviado {contrato.oficios_institucion} oficio(s) de advertencia (límite {contrato.limite_oficios}).
                        {contrato.oficios_institucion >= contrato.limite_oficios ? ' Puede dejar de comprarnos en contratos que no sean abiertos.' : ' Con uno más puede dejar de comprarnos.'}
                    </Aviso>
                )}
                {contrato.advertencia_monto && <Aviso tono="amarillo">{contrato.advertencia_monto}</Aviso>}
            </div>

            <Tarjeta titulo="Productos del contrato">
                <Tabla
                    claveFila="id_detalle_contrato"
                    filas={contrato.renglones}
                    columnas={[
                        { clave: 'numero_renglon', titulo: 'Renglón', alinear: 'right' },
                        { clave: 'producto', titulo: 'Producto', render: r => <Link to={`/productos/${r.id_producto}`} style={{ color: '#3D7EF6' }}>{r.Producto?.nombre} {r.Producto?.concentracion}</Link> },
                        { clave: 'contratada', titulo: 'Contratado', alinear: 'right', render: r => numero(r.cantidad_contratada) },
                        {
                            clave: 'entregada', titulo: 'Entregado', alinear: 'right', render: r => (
                                <div>{numero(r.cantidad_entregada)}{r.cantidad_devuelta > 0 && <p className="text-[11px] opacity-70">{numero(r.cantidad_devuelta)} devueltas</p>}</div>
                            )
                        },
                        {
                            // Lo que falta entregar; si una parte ya está en pedidos en curso, se aclara abajo
                            clave: 'falta', titulo: 'Falta entregar', alinear: 'right', render: r => {
                                if (r.saldo_por_entregar <= 0) return <Insignia tono="verde">Completo</Insignia>;
                                const enCurso = r.cantidad_pedida - r.cantidad_entregada;
                                return <div><b>{numero(r.saldo_por_entregar)}</b>{enCurso > 0 && <p className="text-[11px] opacity-70">{numero(enCurso)} ya en pedidos</p>}</div>;
                            }
                        }
                    ]}
                />
            </Tarjeta>

            <Tarjeta titulo="Prórrogas, notas técnicas y oficios" icono={Gavel}
                acciones={puedeTramitar && !['anulado', 'cancelado'].includes(contrato.estado) && <>
                    {vigente && !prorrogaEnTramite && <Boton pequeno variante="secundario" icono={CalendarPlus} onClick={() => abrirTramite('prorroga')}>Solicitar prórroga</Boton>}
                    {vigente && contrato.contrato_abierto && <Boton pequeno variante="secundario" icono={ClipboardList} onClick={() => abrirTramite('nota_tecnica')}>Nota técnica</Boton>}
                    <Boton pequeno variante="secundario" icono={FileWarning} onClick={() => abrirTramite('oficio')}>Registrar oficio</Boton>
                </>}>
                {tramites.length === 0 ? <p className="text-[13px] opacity-70">Ninguno.</p> : <Tabla
                    claveFila="id_tramite"
                    filas={tramites}
                    columnas={[
                        { clave: 'tipo', titulo: 'Trámite', render: t => <Insignia tono={TIPOS_TRAMITE[t.tipo]?.tono}>{TIPOS_TRAMITE[t.tipo]?.label}</Insignia> },
                        { clave: 'numero', titulo: 'Documento', render: t => <div><p className="font-medium">{t.numero_documento}</p><p className="text-[11px] opacity-70">{formatFecha(t.fecha_documento)}</p></div> },
                        { clave: 'causa', titulo: 'Causa', render: t => <div className="max-w-[280px]"><p>{causas?.[t.tipo]?.[t.causa] || t.causa}</p><p className="text-[11px] opacity-70">{t.descripcion}</p></div> },
                        { clave: 'detalle', titulo: 'Detalle', render: t => detalleTramite(t) },
                        {
                            clave: 'estado', titulo: 'Estado', render: t => (
                                <div><Insignia tono={ESTADOS_TRAMITE[t.estado]?.tono} punto>{ESTADOS_TRAMITE[t.estado]?.label}</Insignia>
                                    {t.observacion_resolucion && <p className="text-[11px] mt-1 opacity-70 max-w-[220px]">{formatFecha(t.fecha_resolucion)}: {t.observacion_resolucion}</p>}</div>
                            )
                        },
                        {
                            clave: 'acc', titulo: '', render: t => (
                                <div className="flex gap-2 justify-end">
                                    {t.estado === 'solicitada' && puedeTramitar && <Boton pequeno variante="info" icono={CheckCircle2} onClick={() => { setError(''); setResolucion({ id_tramite: t.id_tramite, tipo: t.tipo, numero: t.numero_documento, estado: 'aprobada', fecha_resolucion: hoyISO(), observacion: '' }); }}>Resolución</Boton>}
                                    {t.estado !== 'anulado' && puede(usuario, 'tramites.anular') && <Boton pequeno variante="peligro" icono={Ban} onClick={() => anularTramite(t)}>Anular</Boton>}
                                </div>
                            )
                        }
                    ]}
                />}
            </Tarjeta>

            <Tarjeta titulo="Pedidos del contrato" icono={Truck}>
                <Tabla
                    claveFila="id_pedido"
                    filas={contrato.pedidos}
                    alHacerClic={p => navigate(`/pedidos/${p.id_pedido}`)}
                    vacio="Sin pedidos."
                    columnas={[
                        { clave: 'numero_pedido', titulo: 'Pedido', render: p => <span style={{ color: '#3D7EF6' }}>{p.numero_pedido}</span> },
                        { clave: 'fecha_programada', titulo: 'Programada', render: p => p.fecha_compromiso ? <div>{formatFecha(p.fecha_programada)}<p className="text-[11px] opacity-70">Compromiso: {formatFecha(p.fecha_compromiso)}</p></div> : formatFecha(p.fecha_programada) },
                        { clave: 'fecha_real_entrega', titulo: 'Entregado', render: p => formatFecha(p.fecha_real_entrega) },
                        { clave: 'monto', titulo: 'Monto', alinear: 'right', render: p => moneda(p.monto_total) },
                        { clave: 'estado', titulo: 'Estado', render: p => <InsigniaPedido valor={p.estado} /> }
                    ]}
                />
            </Tarjeta>

            <Adjuntos entidad="contratos" id={contrato.id_contrato} permiso="adjuntos.contratos" tipoInicial="Contrato"
                titulo="Documentos del contrato" nota="Contrato firmado, solicitudes de prórroga y sus documentos de respaldo, resoluciones, oficios y notas técnicas."
                vacio="Todavía no hay documentos. Toca aquí para adjuntar el contrato, una solicitud de prórroga o un oficio." />

            <Modal abierto={!!tramite} titulo={tramite ? (tramite.tipo === 'prorroga' ? 'Solicitar prórroga del contrato' : tramite.tipo === 'nota_tecnica' ? 'Nota técnica (contrato abierto)' : 'Registrar oficio de advertencia') : ''}
                alCerrar={() => setTramite(null)} ancho="max-w-2xl"
                pie={<><Boton variante="secundario" onClick={() => setTramite(null)}>Cancelar</Boton><Boton type="submit" form="form-tramite">Registrar</Boton></>}>
                {tramite && (
                    <form id="form-tramite" onSubmit={guardarTramite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Aviso className="md:col-span-2">{AYUDA_TRAMITE[tramite.tipo]}</Aviso>
                        <Campo etiqueta={tramite.tipo === 'oficio' ? 'No. de oficio' : 'No. de solicitud o expediente'} obligatorio>
                            <Entrada required value={tramite.numero_documento} onChange={e => setTramite({ ...tramite, numero_documento: e.target.value })} />
                        </Campo>
                        <Campo etiqueta={tramite.tipo === 'oficio' ? 'Fecha del oficio' : 'Fecha de la solicitud'} obligatorio>
                            <Entrada type="date" required max={hoyISO()} value={tramite.fecha_documento} onChange={e => setTramite({ ...tramite, fecha_documento: e.target.value })} />
                        </Campo>
                        <Campo etiqueta="Causa" obligatorio className="md:col-span-2">
                            <Selector vacio="Seleccionar" required value={tramite.causa} onChange={e => setTramite({ ...tramite, causa: e.target.value })} opciones={opcionesCausa(tramite.tipo)} />
                        </Campo>
                        {tramite.tipo === 'prorroga' && (
                            <Campo etiqueta="Nueva fecha de fin solicitada" obligatorio ayuda={`Hoy el contrato termina el ${formatFecha(contrato.fecha_fin)}.`}>
                                <Entrada type="date" required min={contrato.fecha_fin} value={tramite.fecha_hasta} onChange={e => setTramite({ ...tramite, fecha_hasta: e.target.value })} />
                            </Campo>
                        )}
                        {tramite.tipo === 'nota_tecnica' && <>
                            <Campo etiqueta="Renglón que no se puede abastecer" obligatorio className="md:col-span-2">
                                <Selector vacio="Seleccionar" required value={tramite.id_detalle_contrato} onChange={e => setTramite({ ...tramite, id_detalle_contrato: e.target.value })}
                                    opciones={contrato.renglones.map(r => ({ value: r.id_detalle_contrato, label: `${r.numero_renglon}. ${r.Producto?.nombre} ${r.Producto?.concentracion || ''}` }))} />
                            </Campo>
                            <Campo etiqueta="Desde" obligatorio><Entrada type="date" required value={tramite.fecha_desde} onChange={e => setTramite({ ...tramite, fecha_desde: e.target.value })} /></Campo>
                            <Campo etiqueta="Hasta" ayuda={`Vacío = ${causas?.dias_nota_tecnica || 30} días.`}><Entrada type="date" min={tramite.fecha_desde} max={contrato.fecha_fin} value={tramite.fecha_hasta} onChange={e => setTramite({ ...tramite, fecha_hasta: e.target.value })} /></Campo>
                        </>}
                        {tramite.tipo === 'oficio' && (
                            <Campo etiqueta="Pedido relacionado" className="md:col-span-2">
                                <Selector vacio="Ninguno (todo el contrato)" value={tramite.id_pedido} onChange={e => setTramite({ ...tramite, id_pedido: e.target.value })}
                                    opciones={contrato.pedidos.map(p => ({ value: p.id_pedido, label: `${p.numero_pedido} · programado ${formatFecha(p.fecha_programada)}` }))} />
                            </Campo>
                        )}
                        <Campo etiqueta={tramite.tipo === 'oficio' ? 'Qué reclama la institución' : 'Justificación y documentos de respaldo'} obligatorio className="md:col-span-2">
                            <AreaTexto rows={3} required value={tramite.descripcion} onChange={e => setTramite({ ...tramite, descripcion: e.target.value })} />
                        </Campo>
                        {error && <Aviso tono="rojo" className="md:col-span-2">{error}</Aviso>}
                    </form>
                )}
            </Modal>

            <Modal abierto={!!resolucion} titulo={resolucion ? `Resolución de ${TIPOS_TRAMITE[resolucion.tipo].label.toLowerCase()} ${resolucion.numero}` : ''} alCerrar={() => setResolucion(null)} ancho="max-w-lg"
                pie={<><Boton variante="secundario" onClick={() => setResolucion(null)}>Cancelar</Boton><Boton type="submit" form="form-resolucion">Guardar</Boton></>}>
                {resolucion && (
                    <form id="form-resolucion" onSubmit={guardarResolucion} className="space-y-4">
                        <Campo etiqueta="¿Qué resolvió la institución?" obligatorio>
                            <Selector required value={resolucion.estado} onChange={e => setResolucion({ ...resolucion, estado: e.target.value })}
                                opciones={[{ value: 'aprobada', label: 'Aprobada' }, { value: 'rechazada', label: 'Rechazada' }]} />
                        </Campo>
                        <Campo etiqueta="Fecha de la resolución" obligatorio><Entrada type="date" required max={hoyISO()} value={resolucion.fecha_resolucion} onChange={e => setResolucion({ ...resolucion, fecha_resolucion: e.target.value })} /></Campo>
                        <Campo etiqueta="No. de resolución u observación" obligatorio><AreaTexto required value={resolucion.observacion} onChange={e => setResolucion({ ...resolucion, observacion: e.target.value })} /></Campo>
                        {resolucion.tipo === 'prorroga' && resolucion.estado === 'aprobada' && <Aviso>Al aprobarla, la fecha de fin del contrato cambia a la solicitada.</Aviso>}
                        {error && <Aviso tono="rojo">{error}</Aviso>}
                    </form>
                )}
            </Modal>

            {editar && <FormContrato contrato={contrato} alCerrar={() => setEditar(false)} alGuardar={(advertencia) => { setEditar(false); mostrar(advertencia ? `Contrato actualizado. ${advertencia}` : 'Contrato actualizado', advertencia ? 'amarillo' : 'verde'); cargar(); }} />}
        </Pagina>
    );
};

export default ContratoDetalle;
