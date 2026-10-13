import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Pill, Package, FileText, Truck, AlertTriangle, Search, Clock, PackageX, LayoutDashboard } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { useLista } from '../../hooks/useCatalogo';
import { Pagina, Encabezado, Tarjeta, Indicador, Tabla, Insignia } from '../../components/ui';
import { InsigniaPedido, InsigniaSemaforo, InsigniaCondicion } from '../../components/insignias';
import { formatFecha } from '../../utils/fechas';
import { numero } from '../../utils/formato';

const Panel = () => {
    const c = useColors();
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [panel, setPanel] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const { datos: productos } = useLista('/productos', { activos: true });

    useEffect(() => { api.get('/panel').then(r => setPanel(r.data)); }, []);

    const encontrados = busqueda.trim()
        ? productos.filter(p => `${p.nombre} ${p.codigo}`.toLowerCase().includes(busqueda.toLowerCase())).slice(0, 8)
        : [];

    const ind = panel?.indicadores || {};

    return (
        <Pagina>
            <Encabezado icono={LayoutDashboard} titulo="Panel de control" subtitulo={`Bienvenido, ${usuario?.nombre}. Este es el estado actual del inventario, los contratos y los pedidos.`}>
                <div className="relative w-72">
                    <div className="flex items-center gap-2 rounded-xl px-4 py-2" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                        <Search size={16} style={{ color: c.textSecondary }} />
                        <input type="text" placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                            className="bg-transparent outline-none text-sm w-full" style={{ color: c.inputText }} />
                    </div>
                    {encontrados.length > 0 && (
                        <div className="absolute top-12 left-0 w-full rounded-xl shadow-lg z-40 overflow-hidden" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                            {encontrados.map(p => (
                                <div key={p.id_producto} className="px-4 py-2.5 cursor-pointer text-sm" style={{ borderBottom: `1px solid ${c.tableBorder}` }}
                                    onClick={() => navigate(`/productos/${p.id_producto}`)}>
                                    <p className="font-medium" style={{ color: c.textPrimary }}>{p.nombre} {p.concentracion}</p>
                                    <p className="text-xs" style={{ color: c.textSecondary }}>{p.codigo} · Existencia {numero(p.existencia)} en {p.lotes_con_existencia} lote(s)</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Encabezado>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                <Indicador etiqueta="Productos" valor={ind.productos ?? '…'} icono={Pill} color="#1F2D6E"
                    detalle={`${ind.productos_bajo_minimo ?? 0} bajo el stock mínimo`} alerta={ind.productos_bajo_minimo > 0} onClick={() => navigate('/productos')} />
                <Indicador etiqueta="Lotes con existencia" valor={ind.lotes_con_existencia ?? '…'} icono={Package} color="#2B8EA6"
                    detalle={`${ind.lotes_en_alerta ?? 0} en alerta de vencimiento o retenidos`} alerta={ind.lotes_en_alerta > 0} onClick={() => navigate('/lotes')} />
                <Indicador etiqueta="Contratos vigentes" valor={ind.contratos_vigentes ?? '…'} icono={FileText} color="#C4467A"
                    detalle={`${ind.contratos_por_vencer ?? 0} por vencer con saldo pendiente`} alerta={ind.contratos_por_vencer > 0} onClick={() => navigate('/contratos')} />
                <Indicador etiqueta="Pedidos en curso" valor={ind.pedidos_en_curso ?? '…'} icono={Truck} color="#B85C4A"
                    detalle={`${ind.pedidos_retrasados ?? 0} retrasados`} alerta={ind.pedidos_retrasados > 0} onClick={() => navigate('/pedidos')} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <Tarjeta titulo="Actividad de los últimos 9 meses" className="xl:col-span-2">
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={panel?.actividad || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke={c.darkMode ? '#334155' : '#F0F0F0'} />
                            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: c.textSecondary }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: c.textSecondary }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: c.card, color: c.textPrimary }} />
                            <Legend />
                            <Line type="monotone" dataKey="ingresos" stroke="#2B8EA6" strokeWidth={2.5} dot={{ r: 3 }} name="Ingresos de compra" />
                            <Line type="monotone" dataKey="pedidos" stroke="#1F2D6E" strokeWidth={2.5} dot={{ r: 3 }} name="Pedidos" />
                            <Line type="monotone" dataKey="entregas" stroke="#C4467A" strokeWidth={2.5} dot={{ r: 3 }} name="Entregas" />
                        </LineChart>
                    </ResponsiveContainer>
                </Tarjeta>

                <Tarjeta titulo="Alertas" icono={AlertTriangle}>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {panel?.alertas.contratos.map(a => (
                            <div key={`c${a.id_contrato}`} className="rounded-lg p-3 cursor-pointer" style={{ backgroundColor: '#FEE2E2' }} onClick={() => navigate(`/contratos/${a.id_contrato}`)}>
                                <p className="text-sm font-medium text-gray-800 flex items-center gap-1"><Clock size={14} /> Contrato {a.numero_contrato}</p>
                                <p className="text-xs text-gray-600">{a.institucion} · vence en {a.dias_para_fin} días · avance {a.porcentaje_avance}%</p>
                            </div>
                        ))}
                        {panel?.alertas.bajo_minimo.map(p => (
                            <div key={`p${p.id_producto}`} className="rounded-lg p-3 cursor-pointer" style={{ backgroundColor: '#FEF3C7' }} onClick={() => navigate(`/productos/${p.id_producto}`)}>
                                <p className="text-sm font-medium text-gray-800 flex items-center gap-1"><PackageX size={14} /> {p.nombre}</p>
                                <p className="text-xs text-gray-600">Existencia {numero(p.existencia)} · mínimo {numero(p.stock_minimo)}</p>
                            </div>
                        ))}
                        {panel?.alertas.lotes.map(l => (
                            <div key={`l${l.id_lote}`} className="rounded-lg p-3 cursor-pointer" style={{ backgroundColor: c.inputBg }} onClick={() => navigate(`/trazabilidad/lote/${l.id_lote}`)}>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium" style={{ color: c.textPrimary }}>{l.producto}</p>
                                    {l.condicion === 'disponible' ? <InsigniaSemaforo semaforo={l.semaforo} /> : <InsigniaCondicion valor={l.condicion} />}
                                </div>
                                <p className="text-xs" style={{ color: c.textSecondary }}>Lote {l.numero_lote} · {l.laboratorio} · {numero(l.existencia)} unid.</p>
                            </div>
                        ))}
                        {panel && !panel.alertas.contratos.length && !panel.alertas.bajo_minimo.length && !panel.alertas.lotes.length && (
                            <p className="text-sm text-center py-8" style={{ color: c.textSecondary }}>Sin alertas activas</p>
                        )}
                    </div>
                </Tarjeta>
            </div>

            <Tarjeta titulo="Pedidos recientes">
                <Tabla
                    claveFila="id_pedido"
                    filas={panel?.pedidos_recientes || []}
                    alHacerClic={p => navigate(`/pedidos/${p.id_pedido}`)}
                    vacio="No hay pedidos registrados."
                    columnas={[
                        { clave: 'numero_pedido', titulo: 'Pedido' },
                        { clave: 'institucion', titulo: 'Institución' },
                        { clave: 'numero_contrato', titulo: 'Contrato' },
                        { clave: 'fecha_programada', titulo: 'Programada', render: p => formatFecha(p.fecha_programada) },
                        {
                            clave: 'estado', titulo: 'Estado', render: p => (
                                <div className="flex gap-1 flex-wrap"><InsigniaPedido valor={p.estado} />{p.dias_retraso > 0 && p.estado !== 'entregado' && <Insignia tono="rojo">{p.dias_retraso} d de retraso</Insignia>}</div>
                            )
                        }
                    ]}
                />
            </Tarjeta>
        </Pagina>
    );
};

export default Panel;
