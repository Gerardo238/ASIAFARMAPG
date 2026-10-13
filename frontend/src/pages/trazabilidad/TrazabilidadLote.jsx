import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GitBranch, ArrowLeft, Factory, Warehouse, Building2, History, ShieldAlert, ArrowUpDown, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { Pagina, Encabezado, Tarjeta, Tabla, Boton, DatoFicha, Insignia } from '../../components/ui';
import { useDialogoMotivo, useAvisos } from '../../hooks/useDialogos';
import { InsigniaSemaforo, InsigniaCondicion, InsigniaPedido } from '../../components/insignias';
import { ESTADOS_PEDIDO, ACCIONES_AUDITORIA } from '../../utils/catalogos';
import { formatFecha, formatFechaHora } from '../../utils/fechas';
import { numero, moneda, mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';

const CAMPOS_LOTE = {
    numero_lote: 'No. lote', fecha_fabricacion: 'Fabricación', fecha_vencimiento: 'Vencimiento', id_laboratorio: 'Laboratorio',
    id_ubicacion: 'Ubicación', costo_unitario: 'Costo', condicion: 'Condición', cantidad_disponible: 'Disponible'
};

// Campos que cambiaron entre el antes y el después de un registro de auditoría
const cambiosDe = (a) => {
    if (!a.datos_antes || !a.datos_despues) return [];
    return Object.keys(CAMPOS_LOTE)
        .filter(k => String(a.datos_antes[k] ?? '') !== String(a.datos_despues[k] ?? ''))
        .map(k => `${CAMPOS_LOTE[k]}: ${a.datos_antes[k] ?? '—'} → ${a.datos_despues[k] ?? '—'}`);
};

const Paso = ({ icono: Icono, titulo, children, color }) => {
    const c = useColors();
    return (
        <div className="flex-1 min-w-56 rounded-xl p-4" style={{ backgroundColor: c.inputBg, borderTop: `4px solid ${color}` }}>
            <div className="flex items-center gap-2 mb-2"><Icono size={18} style={{ color }} /><p className="font-bold text-sm" style={{ color: c.textPrimary }}>{titulo}</p></div>
            <div className="text-sm space-y-0.5" style={{ color: c.textSecondary }}>{children}</div>
        </div>
    );
};

const TrazabilidadLote = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const c = useColors();
    const { usuario } = useAuth();
    const [datos, setDatos] = useState(null);
    const [dialogo, pedirMotivo] = useDialogoMotivo();
    const [aviso, mostrar] = useAvisos();

    const cargar = useCallback(() => api.get(`/trazabilidad/lote/${id}`).then(r => setDatos(r.data)), [id]);
    useEffect(() => { cargar(); }, [cargar]);

    if (!datos) return <Pagina><p>Cargando...</p></Pagina>;
    const { lote, movimientos, destinos, cambios } = datos;
    const despachado = destinos.reduce((s, d) => s + d.cantidad, 0);

    const bloquear = async () => {
        const motivo = await pedirMotivo({ titulo: `Bloquear lote ${lote.numero_lote}`, peligro: true, confirmar: 'Bloquear lote', mensaje: 'El lote dejará de despacharse. Úsalo ante un retiro del mercado, una alerta sanitaria o un reporte de reacción adversa.' });
        if (!motivo) return;
        try { await api.post(`/lotes/${lote.id_lote}/condicion`, { condicion: 'bloqueado', motivo }); mostrar('Lote bloqueado'); cargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };


    return (
        <Pagina>
            {aviso}{dialogo}
            <Encabezado icono={GitBranch} titulo={`Lote ${lote.numero_lote}`} color="#2B8EA6"
                subtitulo={`${lote.Producto?.nombre} ${lote.Producto?.concentracion || ''} · ${lote.Producto?.codigo}`}>
                {puede(usuario, 'lotes.editar') && !['bloqueado', 'anulado', 'vencido'].includes(lote.condicion) &&
                    <Boton variante="peligro" icono={ShieldAlert} onClick={bloquear}>Bloquear lote (retiro)</Boton>}
                <Boton variante="secundario" icono={ArrowLeft} onClick={() => navigate(-1)}>Volver</Boton>
            </Encabezado>

            {/* Recorrido: origen -> bodega -> destinos */}
            <div className="flex flex-wrap gap-3 mb-6">
                <Paso icono={Factory} titulo="Origen" color="#1F2D6E">
                    <p>Fabricante: <b>{lote.Laboratorio?.nombre}</b> {lote.Laboratorio?.pais && `(${lote.Laboratorio.pais})`}</p>
                    <p>Proveedor: <b>{lote.Ingreso?.Proveedor?.nombre}</b> · NIT {lote.Ingreso?.Proveedor?.nit}</p>
                    <p>Factura {lote.Ingreso?.serie_factura}-{lote.Ingreso?.numero_factura} del {formatFecha(lote.Ingreso?.fecha_factura)}</p>
                    <p>Recibido el {formatFecha(lote.Ingreso?.fecha_recepcion)} por {lote.Ingreso?.Usuario?.nombre} {lote.Ingreso?.Usuario?.apellido}</p>
                </Paso>
                <Paso icono={Warehouse} titulo="En bodega" color="#2B8EA6">
                    <p>Recibido: <b>{numero(lote.cantidad_recibida)}</b> · Disponible: <b>{numero(lote.cantidad_disponible)}</b></p>
                    <p>Ubicación: {lote.Ubicacion?.nombre}</p>
                    <div className="flex flex-wrap gap-1 pt-1"><InsigniaCondicion valor={lote.condicion} /><InsigniaSemaforo semaforo={lote.semaforo} /></div>
                    {lote.motivo_condicion && <p className="text-xs pt-1">Motivo: {lote.motivo_condicion}</p>}
                </Paso>
                <Paso icono={Building2} titulo="Destinos" color="#C4467A">
                    <p>Despachado: <b>{numero(despachado)}</b> en {destinos.length} entrega(s)</p>
                    {[...new Set(destinos.map(d => d.institucion))].map(i => <p key={i}>• {i}</p>)}
                    {destinos.length === 0 && <p>Todavía no se ha despachado.</p>}
                </Paso>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                <DatoFicha etiqueta="Fabricación" valor={formatFecha(lote.fecha_fabricacion)} />
                <DatoFicha etiqueta="Vencimiento" valor={formatFecha(lote.fecha_vencimiento)} />
                <DatoFicha etiqueta="Costo unitario" valor={moneda(lote.costo_unitario)} />
                <DatoFicha etiqueta="Apto para despacho" valor={lote.apto_despacho ? 'Sí' : 'No'} />
                <DatoFicha etiqueta="Fecha de ingreso al sistema" valor={formatFechaHora(lote.createdAt)} />
                <DatoFicha etiqueta="Ingreso" valor={<Link to="/ingresos" style={{ color: '#2B8EA6' }}>Ver ingresos</Link>} />
            </div>

            <Tarjeta titulo="Destinos: a quién se entregó" icono={Building2}>
                {destinos.length === 0 ? <p className="text-sm" style={{ color: c.textSecondary }}>Este lote no se ha despachado a ninguna institución.</p> : (
                    <div className="space-y-3">
                        {destinos.map((d, i) => (
                            <div key={i} className="rounded-xl p-4" style={{ backgroundColor: c.inputBg }}>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <div>
                                        <p className="font-bold" style={{ color: c.textPrimary }}>{d.institucion} {d.departamento && <span className="font-normal text-sm">({d.departamento})</span>}</p>
                                        <p className="text-sm" style={{ color: c.textSecondary }}>
                                            <Link to={`/pedidos/${d.id_pedido}`} style={{ color: '#2B8EA6' }}>{d.numero_pedido}</Link> · Contrato {d.numero_contrato} · NOG {d.nog} · <b>{numero(d.cantidad)}</b> unidades
                                        </p>
                                    </div>
                                    <InsigniaPedido valor={d.estado} />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {d.seguimiento.map(s => (
                                        <div key={s.id_seguimiento} className="flex items-center gap-1.5 text-xs rounded-lg px-2 py-1" style={{ backgroundColor: c.card, color: c.textPrimary }}>
                                            <CheckCircle2 size={14} style={{ color: '#2B8EA6' }} />
                                            <b>{ESTADOS_PEDIDO[s.estado]?.label || s.estado}</b> {formatFechaHora(s.fecha)} · {s.Usuario?.nombre} {s.Usuario?.apellido}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Tarjeta>

            <Tarjeta titulo="Kárdex del lote" icono={ArrowUpDown}>
                <Tabla
                    claveFila="id_movimiento"
                    filas={movimientos}
                    columnas={[
                        { clave: 'fecha', titulo: 'Fecha', render: m => formatFechaHora(m.fecha_movimiento) },
                        { clave: 'motivo', titulo: 'Motivo', render: m => <Insignia tono={m.tipo_movimiento === 'entrada' ? 'verde' : 'rojo'}>{m.MotivoMovimiento?.nombre}</Insignia> },
                        { clave: 'cant', titulo: 'Cantidad', alinear: 'right', render: m => `${m.tipo_movimiento === 'entrada' ? '+' : '-'}${numero(m.cantidad)}` },
                        { clave: 'saldo', titulo: 'Saldo', alinear: 'right', render: m => <b>{numero(m.saldo)}</b> },
                        { clave: 'ref', titulo: 'Referencia', render: m => m.Pedido ? `${m.Pedido.numero_pedido} · ${m.Pedido.Contrato?.Institucion?.nombre}` : m.Ingreso ? `Factura ${m.Ingreso.serie_factura}-${m.Ingreso.numero_factura}` : m.observacion },
                        { clave: 'usuario', titulo: 'Usuario', render: m => m.Usuario ? `${m.Usuario.nombre} ${m.Usuario.apellido}` : 'Sistema' }
                    ]}
                />
            </Tarjeta>

            <Tarjeta titulo="Historial de cambios (auditoría)" icono={History}>
                <Tabla
                    claveFila="id_auditoria"
                    filas={cambios}
                    vacio="Sin cambios registrados."
                    columnas={[
                        { clave: 'fecha', titulo: 'Fecha', render: a => formatFechaHora(a.fecha) },
                        { clave: 'usuario', titulo: 'Usuario', render: a => a.Usuario ? `${a.Usuario.nombre} ${a.Usuario.apellido}` : 'Sistema' },
                        { clave: 'accion', titulo: 'Acción', render: a => ACCIONES_AUDITORIA[a.accion] || a.accion },
                        { clave: 'cambios', titulo: 'Qué cambió', render: a => <div className="text-xs space-y-0.5">{cambiosDe(a).map(t => <div key={t}>{t}</div>)}</div> },
                        { clave: 'motivo', titulo: 'Motivo', render: a => a.motivo || '—' }
                    ]}
                />
            </Tarjeta>
        </Pagina>
    );
};

export default TrazabilidadLote;
