import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ArrowLeft, ShieldAlert, PackageOpen, Send, Warehouse, CalendarClock, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useColors, MARCA } from '../../hooks/useColors';
import { useTonos } from '../../hooks/useTonos';
import { Pagina, Encabezado, Pildora, Tarjeta, Tabla, Boton, Indicador, Etapas } from '../../components/ui';
import { useDialogoMotivo, useAvisos } from '../../hooks/useDialogos';
import { InsigniaSemaforo, InsigniaCondicion } from '../../components/insignias';
import { ESTADOS_PEDIDO, ACCIONES_AUDITORIA } from '../../utils/catalogos';
import { formatFecha, formatFechaHora, tiempoRestante } from '../../utils/fechas';
import { numero, moneda, mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';
import Adjuntos from '../../components/Adjuntos';

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

// Colores de la dona: uno por institución y gris claro para lo que queda en bodega
const PALETA = [MARCA.morado, MARCA.azul, MARCA.amarillo, MARCA.verde, MARCA.magenta, MARCA.ocre];
const TONO_PEDIDO = { pendiente: 'amarillo', en_preparacion: 'azul', empacado: 'morado', en_transporte: 'azul', entregado: 'verde', anulado: 'gris' };

const TrazabilidadLote = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const c = useColors();
    const tonos = useTonos();
    const { usuario } = useAuth();
    const [datos, setDatos] = useState(null);
    const [dialogo, pedirMotivo] = useDialogoMotivo();
    const [aviso, mostrar] = useAvisos();

    const cargar = useCallback(() => api.get(`/trazabilidad/lote/${id}`).then(r => setDatos(r.data)), [id]);
    useEffect(() => { cargar(); }, [cargar]);

    if (!datos) return <Pagina><p style={{ color: c.textSecondary }}>Cargando…</p></Pagina>;
    const { lote, movimientos, destinos, cambios } = datos;
    const despachado = destinos.reduce((s, d) => s + d.cantidad, 0);
    const disponible = Number(lote.cantidad_disponible);
    const retenido = ['bloqueado', 'cuarentena', 'vencido', 'anulado'].includes(lote.condicion);

    // Unidades por institución (para la dona y su leyenda)
    const porInstitucion = Object.values(destinos.reduce((acc, d) => {
        const g = acc[d.institucion] || (acc[d.institucion] = { nombre: d.institucion, valor: 0, entregas: 0 });
        g.valor += d.cantidad; g.entregas += 1;
        return acc;
    }, {})).map((g, i) => ({ ...g, color: PALETA[i % PALETA.length] }));
    const dona = [...porInstitucion, ...(disponible > 0 ? [{ nombre: 'En bodega', valor: disponible, color: c.riel }] : [])];
    const totalDona = dona.reduce((s, x) => s + x.valor, 0);

    // Fecha de la última etapa de cada entrega
    const ultimaEtapa = (d) => d.seguimiento[d.seguimiento.length - 1];

    const bloquear = async () => {
        const motivo = await pedirMotivo({ titulo: `Bloquear lote ${lote.numero_lote}`, peligro: true, confirmar: 'Bloquear lote', mensaje: 'El lote dejará de despacharse. Úsalo ante un retiro del mercado, una alerta sanitaria o un reporte de reacción adversa.' });
        if (!motivo) return;
        try { await api.post(`/lotes/${lote.id_lote}/condicion`, { condicion: 'bloqueado', motivo }); mostrar('Lote bloqueado'); cargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const fila = (etiqueta, valor) => (
        <div className="flex justify-between gap-4 py-2.5" style={{ borderTop: `1px solid ${c.tableBorder}` }}>
            <span className="text-[12.5px]" style={{ color: c.textSecondary }}>{etiqueta}</span>
            <span className="text-[13px] font-medium text-right" style={{ color: c.textPrimary }}>{valor}</span>
        </div>
    );

    return (
        <Pagina>
            {aviso}{dialogo}
            <Encabezado titulo={`Lote ${lote.numero_lote}`}>
                <Pildora>{lote.Producto?.nombre} {lote.Producto?.concentracion} · {lote.Producto?.codigo}</Pildora>
                <InsigniaCondicion valor={lote.condicion} />
                <Boton variante="secundario" pequeno icono={ArrowLeft} onClick={() => navigate(-1)}>Volver</Boton>
                {puede(usuario, 'lotes.editar') && !['bloqueado', 'anulado', 'vencido'].includes(lote.condicion) &&
                    <Boton variante="peligro" pequeno icono={ShieldAlert} onClick={bloquear}>Bloquear (retiro)</Boton>}
            </Encabezado>

            {/* Si el lote está retenido, lo primero que se ve es por qué */}
            {retenido && lote.motivo_condicion && (
                <div className="flex items-start gap-3 rounded-xl px-5 py-4 mb-5" style={{ backgroundColor: tonos.rojo.fila }}>
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: MARCA.rojo }} />
                    <div className="text-[13px]" style={{ color: c.textPrimary }}>
                        <b className="font-semibold">Lote {lote.condicion}.</b> {lote.motivo_condicion}
                        {destinos.length > 0 && <span style={{ color: c.textSecondary }}> · Ya se entregó a {porInstitucion.length} institución(es): están en la tabla de abajo.</span>}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
                <Indicador etiqueta="Recibido" icono={PackageOpen} valor={numero(lote.cantidad_recibida)}
                    detalle={`Factura ${lote.Ingreso?.serie_factura}-${lote.Ingreso?.numero_factura} · ${formatFecha(lote.Ingreso?.fecha_recepcion)}`} />
                <Indicador etiqueta="Salió" icono={Send} valor={numero(despachado)}
                    detalle={destinos.length ? `En ${destinos.length} entrega(s) a ${porInstitucion.length} institución(es)` : 'Todavía no sale de bodega'} />
                <Indicador etiqueta="Queda en bodega" icono={Warehouse} valor={numero(disponible)} alerta={retenido && disponible > 0}
                    detalle={retenido && disponible > 0 ? 'Retenido: no se puede despachar' : `${lote.Ubicacion?.nombre} · ${lote.apto_despacho ? 'apto para despacho' : 'no apto para despacho'}`} />
                <Indicador etiqueta="Vence" icono={CalendarClock} valor={formatFecha(lote.fecha_vencimiento)}
                    detalle={tiempoRestante(lote.semaforo.dias)} alerta={lote.semaforo.color === 'rojo' || lote.semaforo.color === 'vencido'} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
                <Tarjeta titulo="A dónde se fue" className="xl:col-span-2 mb-0!">
                    <div className="flex items-center gap-6">
                        <div className="relative w-[170px] h-[170px] shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={totalDona ? dona : [{ valor: 1, color: c.riel }]} dataKey="valor" innerRadius={52} outerRadius={82} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                                        {(totalDona ? dona : [{ color: c.riel }]).map((x, i) => <Cell key={i} fill={x.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', backgroundColor: c.card, color: c.textPrimary, fontSize: 12 }} formatter={(v, n, p) => [`${numero(v)} unid.`, p.payload.nombre]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[22px] font-medium" style={{ color: c.textPrimary }}>{numero(lote.cantidad_recibida)}</span>
                                <span className="text-[10.5px]" style={{ color: c.textSecondary }}>recibidas</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2.5">
                            {dona.map(x => (
                                <div key={x.nombre} className="flex items-center gap-2.5">
                                    <span className="w-3 h-2 rounded-full shrink-0" style={{ backgroundColor: x.nombre === 'En bodega' ? (c.darkMode ? '#5A5A6A' : '#C9D6F0') : x.color }} />
                                    <span className="flex-1 text-[13px] truncate" style={{ color: c.textPrimary }}>{x.nombre}</span>
                                    <span className="text-[13px] font-semibold" style={{ color: c.textPrimary }}>{numero(x.valor)}</span>
                                    <span className="text-[11px] w-10 text-right" style={{ color: c.textSecondary }}>{totalDona ? Math.round((x.valor / Number(lote.cantidad_recibida)) * 100) : 0}%</span>
                                </div>
                            ))}
                            {!destinos.length && <p className="text-[12.5px]" style={{ color: c.textSecondary }}>Todavía no se ha entregado a ninguna institución.</p>}
                        </div>
                    </div>
                </Tarjeta>

                <Tarjeta titulo="De dónde vino" className="xl:col-span-2 mb-0!">
                    {fila('Fabricante', `${lote.Laboratorio?.nombre}${lote.Laboratorio?.pais ? ` · ${lote.Laboratorio.pais}` : ''}`)}
                    {fila('Proveedor', <>{lote.Ingreso?.Proveedor?.nombre} <span style={{ color: c.textSecondary }}>· NIT {lote.Ingreso?.Proveedor?.nit}</span></>)}
                    {fila('Factura', `${lote.Ingreso?.serie_factura}-${lote.Ingreso?.numero_factura} del ${formatFecha(lote.Ingreso?.fecha_factura)}`)}
                    {fila('Recibido', `${formatFecha(lote.Ingreso?.fecha_recepcion)} por ${lote.Ingreso?.Usuario?.nombre || ''} ${lote.Ingreso?.Usuario?.apellido || ''}`)}
                    {fila('Fabricación / vencimiento', `${formatFecha(lote.fecha_fabricacion)} → ${formatFecha(lote.fecha_vencimiento)}`)}
                    {fila('Costo unitario', moneda(lote.costo_unitario))}
                    {fila('Semáforo', <InsigniaSemaforo semaforo={lote.semaforo} />)}
                </Tarjeta>
            </div>

            <div className="mt-5">
                <Tarjeta titulo="A quién se entregó" nota="Una fila por entrega. Haz clic para abrir el pedido." sinPadding>
                    <Tabla
                        claveFila="id_pedido"
                        filas={destinos}
                        tonoFila={d => TONO_PEDIDO[d.estado]}
                        alHacerClic={d => navigate(`/pedidos/${d.id_pedido}`)}
                        vacio="Este lote no se ha despachado a ninguna institución."
                        columnas={[
                            { clave: 'inst', titulo: 'Institución', render: d => <div><p className="font-semibold">{d.institucion}</p><p className="text-[11px]" style={{ color: c.textSecondary }}>{d.departamento}</p></div> },
                            { clave: 'pedido', titulo: 'Pedido', render: d => <Link to={`/pedidos/${d.id_pedido}`} onClick={e => e.stopPropagation()} className="font-medium hover:underline" style={{ color: MARCA.azul }}>{d.numero_pedido}</Link> },
                            { clave: 'contrato', titulo: 'Contrato', render: d => <div><p>{d.numero_contrato}</p><p className="text-[11px]" style={{ color: c.textSecondary }}>NOG {d.nog}</p></div> },
                            { clave: 'cant', titulo: 'Unidades', alinear: 'right', render: d => <b className="font-semibold">{numero(d.cantidad)}</b> },
                            {
                                clave: 'etapa', titulo: 'Etapa', render: d => (
                                    <div><p className="text-[12.5px] mb-1.5">{ESTADOS_PEDIDO[d.estado]?.label}{d.fecha_entrega ? ` el ${formatFecha(d.fecha_entrega)}` : ''}</p><Etapas estado={d.estado} /></div>
                                )
                            },
                            { clave: 'ult', titulo: 'Último movimiento', render: d => { const u = ultimaEtapa(d); return u ? <div><p className="text-[12.5px]">{formatFechaHora(u.fecha)}</p><p className="text-[11px]" style={{ color: c.textSecondary }}>{u.Usuario?.nombre} {u.Usuario?.apellido}</p></div> : '—'; } }
                        ]}
                    />
                </Tarjeta>
            </div>

            <Tarjeta titulo="Kárdex del lote" nota="Cada entrada y salida, con el saldo que quedó" sinPadding>
                <Tabla
                    claveFila="id_movimiento"
                    filas={movimientos}
                    columnas={[
                        { clave: 'fecha', titulo: 'Fecha', render: m => <span className="whitespace-nowrap">{formatFechaHora(m.fecha_movimiento)}</span> },
                        { clave: 'motivo', titulo: 'Movimiento', render: m => m.MotivoMovimiento?.nombre },
                        { clave: 'ref', titulo: 'Referencia', render: m => <span style={{ color: c.textSecondary }}>{m.Pedido ? `${m.Pedido.numero_pedido} · ${m.Pedido.Contrato?.Institucion?.nombre}` : m.Ingreso ? `Factura ${m.Ingreso.serie_factura}-${m.Ingreso.numero_factura}` : m.observacion}</span> },
                        { clave: 'cant', titulo: 'Cantidad', alinear: 'right', render: m => <span className="font-semibold" style={{ color: m.tipo_movimiento === 'entrada' ? MARCA.verde : MARCA.rojo }}>{m.tipo_movimiento === 'entrada' ? '+' : '−'}{numero(m.cantidad)}</span> },
                        { clave: 'saldo', titulo: 'Saldo', alinear: 'right', render: m => <b className="font-semibold">{numero(m.saldo)}</b> },
                        { clave: 'usuario', titulo: 'Usuario', render: m => m.Usuario ? `${m.Usuario.nombre} ${m.Usuario.apellido}` : 'Sistema' }
                    ]}
                />
            </Tarjeta>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-5">
                <Adjuntos entidad="ingresos" id={lote.id_ingreso} titulo="Factura de compra"
                    nota={`Foto o PDF de la factura ${lote.Ingreso?.serie_factura}-${lote.Ingreso?.numero_factura}`} />
                <Adjuntos entidad="lotes" id={lote.id_lote} titulo="Documentos del lote" tipoInicial="Certificado de análisis"
                    nota="Certificado de análisis, actas de destrucción o retiro" />
            </div>

            <Tarjeta titulo="Historial de cambios" nota="Quién cambió algo de este lote, cuándo y por qué" sinPadding>
                <Tabla
                    claveFila="id_auditoria"
                    filas={cambios}
                    vacio="Sin cambios registrados."
                    columnas={[
                        { clave: 'fecha', titulo: 'Fecha', render: a => <span className="whitespace-nowrap">{formatFechaHora(a.fecha)}</span> },
                        { clave: 'usuario', titulo: 'Usuario', render: a => a.Usuario ? `${a.Usuario.nombre} ${a.Usuario.apellido}` : 'Sistema' },
                        { clave: 'accion', titulo: 'Acción', render: a => ACCIONES_AUDITORIA[a.accion] || a.accion },
                        { clave: 'cambios', titulo: 'Qué cambió', render: a => <div className="text-[12px] space-y-0.5">{cambiosDe(a).map(t => <div key={t}>{t}</div>)}</div> },
                        { clave: 'motivo', titulo: 'Motivo', render: a => <span style={{ color: c.textSecondary }}>{a.motivo || '—'}</span> }
                    ]}
                />
            </Tarjeta>
        </Pagina>
    );
};

export default TrazabilidadLote;
