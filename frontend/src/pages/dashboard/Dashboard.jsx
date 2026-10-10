import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Pill, Package, FileText, Truck, AlertTriangle, Bell, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatFecha, parseFecha } from '../../utils/fechas';

// ---------- Gráfica de actividad ----------
const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Devuelve la primera fecha que exista en el registro, en el orden indicado
const fechaDe = (registro, campos) => {
    for (const campo of campos) {
        if (registro[campo]) return parseFecha(registro[campo]);
    }
    return null;
};

// Cuenta cuántos registros hay en cada uno de los últimos 9 meses (incluido el actual)
const armarActividad = (pedidos, contratos, lotes) => {
    const hoy = new Date();
    const meses = [];
    for (let i = 8; i >= 0; i--) {
        const f = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        meses.push({ clave: `${f.getFullYear()}-${f.getMonth()}`, mes: NOMBRES_MES[f.getMonth()], pedidos: 0, contratos: 0, lotes: 0 });
    }
    const sumar = (lista, campos, tipo) => {
        lista.forEach(r => {
            const f = fechaDe(r, campos);
            if (!f || isNaN(f)) return;
            const m = meses.find(x => x.clave === `${f.getFullYear()}-${f.getMonth()}`);
            if (m) m[tipo] += 1;
        });
    };
    sumar(pedidos, ['fecha_programada', 'createdAt', 'created_at'], 'pedidos');
    sumar(contratos, ['fecha_inicio', 'createdAt', 'created_at'], 'contratos');
    sumar(lotes, ['createdAt', 'created_at', 'fecha_fabricacion'], 'lotes');
    return meses;
};

const Dashboard = () => {
    const { usuario } = useAuth();
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ productos: 0, lotes: 0, contratos: 0, pedidos: 0, alertas: [] });
    const [pedidosRecientes, setPedidosRecientes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [mostrarAlertas, setMostrarAlertas] = useState(false);
    const [todosProductos, setTodosProductos] = useState([]);
    const bg = darkMode ? '#0F172A' : '#F0F4F8';
    const card = darkMode ? '#1E293B' : '#FFFFFF';
    const cardBorder = darkMode ? '#334155' : '#F1F5F9';
    const textPrimary = darkMode ? '#F1F5F9' : '#1F2937';
    const textSecondary = darkMode ? '#94A3B8' : '#6B7280';
    const topBar = darkMode ? '#1E293B' : '#FFFFFF';
    const searchBg = darkMode ? '#0F172A' : '#F3F4F6';
    const inputText = darkMode ? '#CBD5E1' : '#4B5563';
    const borderColor = darkMode ? '#334155' : '#F3F4F6';
    const [datosGrafica, setDatosGrafica] = useState([]);
    useEffect(() => {
        const cargarStats = async () => {
            try {
                const [productos, lotes, contratos, pedidos, alertas] = await Promise.all([
                    api.get('/productos'), api.get('/lotes'), api.get('/contratos'),
                    api.get('/pedidos'), api.get('/lotes/alertas')
                ]);
                setStats({
                    productos: productos.data.length, lotes: lotes.data.length,
                    contratos: contratos.data.length, pedidos: pedidos.data.length,
                    alertas: alertas.data
                });
                setPedidosRecientes(pedidos.data.slice(0, 5));
                setTodosProductos(productos.data);
                setDatosGrafica(armarActividad(pedidos.data, contratos.data, lotes.data));
            } catch (error) { console.error('Error:', error); }
        };
        cargarStats();
    }, []);
    useEffect(() => {
        if (busqueda.trim() === '') { setResultadosBusqueda([]); return; }
        const filtrados = todosProductos.filter(p =>
            p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.codigo.toLowerCase().includes(busqueda.toLowerCase())
        );
        setResultadosBusqueda(filtrados);
    }, [busqueda, todosProductos]);
    const cards = [
        { label: 'Productos', value: stats.productos, color: '#1F2D6E', icon: Pill, sub: 'Total registrados' },
        { label: 'Lotes', value: stats.lotes, color: '#2B8EA6', icon: Package, sub: 'En inventario' },
        { label: 'Contratos', value: stats.contratos, color: '#C4467A', icon: FileText, sub: 'Activos' },
        { label: 'Pedidos', value: stats.pedidos, color: '#B85C4A', icon: Truck, sub: 'Total generados' },
    ];
    const getEstadoColor = (estado) => {
        const colores = {
            pendiente: { bg: '#FEF3C7', text: '#92400E' },
            en_proceso: { bg: '#DBEAFE', text: '#1E40AF' },
            despachado: { bg: '#EDE9FE', text: '#5B21B6' },
            entregado: { bg: '#D1FAE5', text: '#065F46' },
            retrasado: { bg: '#FEE2E2', text: '#991B1B' }
        };
        return colores[estado] || { bg: '#F3F4F6', text: '#374151' };
    };
    return (
        <div className="min-h-screen" style={{ backgroundColor: bg }}>
            {(mostrarAlertas || busqueda) && (
                <div className="fixed inset-0 z-40"
                    onClick={() => { setMostrarAlertas(false); setBusqueda(''); }} />
            )}
            {/* Barra superior */}
            <div className="px-8 py-4 flex items-center justify-between shadow-sm mb-6"
                style={{ backgroundColor: topBar, borderBottom: `1px solid ${borderColor}` }}>
                <div className="relative w-72">
                    <div className="flex items-center gap-3 rounded-xl px-4 py-2" style={{ backgroundColor: searchBg }}>
                        <Search size={16} style={{ color: textSecondary }} />
                        <input type="text" placeholder="Buscar producto..." value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="bg-transparent outline-none text-sm w-full"
                            style={{ color: inputText }} />
                    </div>
                    {busqueda && resultadosBusqueda.length > 0 && (
                        <div className="absolute top-12 left-0 w-full rounded-xl shadow-lg z-50 overflow-hidden"
                            style={{ backgroundColor: card, border: `1px solid ${borderColor}` }}>
                            {resultadosBusqueda.map(p => (
                                <div key={p.id_producto} className="px-4 py-3 cursor-pointer"
                                    style={{ borderBottom: `1px solid ${borderColor}` }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = searchBg}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    onClick={() => { setBusqueda(''); setResultadosBusqueda([]); navigate('/productos'); }}>
                                    <p className="text-sm font-medium" style={{ color: textPrimary }}>{p.nombre}</p>
                                    <p className="text-xs" style={{ color: textSecondary }}>{p.codigo} — {p.forma_farmaceutica}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {busqueda && resultadosBusqueda.length === 0 && (
                        <div className="absolute top-12 left-0 w-full rounded-xl shadow-lg z-50 p-4 text-center text-sm"
                            style={{ backgroundColor: card, border: `1px solid ${borderColor}`, color: textSecondary }}>
                            No se encontraron productos
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button onClick={() => setMostrarAlertas(!mostrarAlertas)}>
                            <Bell size={20} style={{ color: textSecondary }} />
                            {stats.alertas.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center"
                                    style={{ backgroundColor: '#C4467A', fontSize: '10px' }}>
                                    {stats.alertas.length}
                                </span>
                            )}
                        </button>
                        {mostrarAlertas && (
                            <div className="absolute right-0 top-8 w-72 rounded-xl shadow-lg z-50 overflow-hidden"
                                style={{ backgroundColor: card, border: `1px solid ${borderColor}` }}>
                                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
                                    <p className="font-bold text-sm" style={{ color: textPrimary }}>Alertas de Vencimiento</p>
                                </div>
                                {stats.alertas.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm" style={{ color: textSecondary }}>Sin alertas activas</div>
                                ) : (
                                    stats.alertas.map(lote => (
                                        <div key={lote.id_lote} className="px-4 py-3"
                                            style={{ borderBottom: `1px solid ${borderColor}` }}>
                                            <p className="text-sm font-medium" style={{ color: textPrimary }}>{lote.Producto?.nombre}</p>
                                            <p className="text-xs" style={{ color: textSecondary }}>Lote: {lote.numero_lote}</p>
                                            <p className="text-xs font-medium mt-1"
                                                style={{ color: lote.semaforo === 'rojo' ? '#991B1B' : lote.semaforo === 'amarillo' ? '#92400E' : '#065F46' }}>
                                                {lote.diasRestantes} días restantes
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: '#1F2D6E' }}>
                            {usuario?.nombre?.charAt(0)}{usuario?.apellido?.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-medium" style={{ color: textPrimary }}>{usuario?.nombre} {usuario?.apellido}</p>
                            <p className="text-xs capitalize" style={{ color: textSecondary }}>{usuario?.rol}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>Dashboard</h1>
                    <p className="text-sm mt-1" style={{ color: textSecondary }}>Bienvenido, {usuario?.nombre}. Aquí está el resumen del sistema.</p>
                </div>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                    {cards.map((c) => {
                        const Icon = c.icon;
                        return (
                            <div key={c.label} className="rounded-2xl p-5 shadow-sm"
                                style={{ backgroundColor: card, border: `1px solid ${cardBorder}` }}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: c.color + '18' }}>
                                        <Icon size={20} style={{ color: c.color }} />
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-lg"
                                        style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>Activo</span>
                                </div>
                                <p className="text-3xl font-bold" style={{ color: textPrimary }}>{c.value}</p>
                                <p className="text-sm font-medium mt-1" style={{ color: textPrimary }}>{c.label}</p>
                                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{c.sub}</p>
                            </div>
                        );
                    })}
                </div>
                {/* Gráfica y Alertas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                    <div className="lg:col-span-2 rounded-2xl p-6 shadow-sm"
                        style={{ backgroundColor: card, border: `1px solid ${cardBorder}` }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold" style={{ color: textPrimary }}>Actividad del Sistema</h2>
                            <span className="text-xs" style={{ color: textSecondary }}>Últimos 9 meses</span>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={datosGrafica}>
                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#F0F0F0'} />
                                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: textSecondary }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: textSecondary }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: card, color: textPrimary }} />
                                <Legend />
                                <Line type="monotone" dataKey="pedidos" stroke="#1F2D6E" strokeWidth={2.5} dot={{ r: 3 }} name="Pedidos" />
                                <Line type="monotone" dataKey="contratos" stroke="#2B8EA6" strokeWidth={2.5} dot={{ r: 3 }} name="Contratos" />
                                <Line type="monotone" dataKey="lotes" stroke="#C4467A" strokeWidth={2.5} dot={{ r: 3 }} name="Lotes" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="rounded-2xl p-6 shadow-sm"
                        style={{ backgroundColor: card, border: `1px solid ${cardBorder}` }}>
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={18} style={{ color: '#C4467A' }} />
                            <h2 className="text-lg font-bold" style={{ color: textPrimary }}>Alertas</h2>
                            {stats.alertas.length > 0 && (
                                <span className="ml-auto text-xs font-medium px-2 py-1 rounded-lg"
                                    style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                                    {stats.alertas.length} activas
                                </span>
                            )}
                        </div>
                        {stats.alertas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40" style={{ color: textSecondary }}>
                                <Package size={32} className="mb-2 opacity-30" />
                                <p className="text-sm">Sin alertas activas</p>
                            </div>
                        ) : (
                            <div className="space-y-3 overflow-y-auto max-h-52">
                                {stats.alertas.map((lote) => (
                                    <div key={lote.id_lote} className="rounded-xl p-3"
                                        style={{ backgroundColor: lote.semaforo === 'rojo' ? '#FEE2E2' : lote.semaforo === 'amarillo' ? '#FEF3C7' : '#D1FAE5' }}>
                                        <p className="text-sm font-medium text-gray-800">{lote.Producto?.nombre}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Lote: {lote.numero_lote}</p>
                                        <p className="text-xs font-medium mt-1"
                                            style={{ color: lote.semaforo === 'rojo' ? '#991B1B' : lote.semaforo === 'amarillo' ? '#92400E' : '#065F46' }}>
                                            {lote.diasRestantes} días restantes
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {/* Tabla pedidos recientes */}
                <div className="rounded-2xl shadow-sm p-6 mb-6"
                    style={{ backgroundColor: card, border: `1px solid ${cardBorder}` }}>
                    <h2 className="text-lg font-bold mb-5" style={{ color: textPrimary }}>Pedidos Recientes</h2>
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                                {['N° Pedido', 'Contrato', 'Fecha Programada', 'Fecha Real', 'Estado'].map(h => (
                                    <th key={h} className="text-left text-xs font-medium pb-3 uppercase tracking-wider"
                                        style={{ color: textSecondary }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pedidosRecientes.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-sm" style={{ color: textSecondary }}>No hay pedidos registrados.</td></tr>
                            ) : (
                                pedidosRecientes.map((p) => {
                                    const estilo = getEstadoColor(p.estado);
                                    return (
                                        <tr key={p.id_pedido} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                            <td className="py-3 text-sm font-medium" style={{ color: '#1F2D6E' }}>{p.numero_pedido}</td>
                                            <td className="py-3 text-sm" style={{ color: textSecondary }}>{p.Contrato?.numero_contrato}</td>
                                            <td className="py-3 text-sm" style={{ color: textSecondary }}>{formatFecha(p.fecha_programada)}</td>
                                            <td className="py-3 text-sm" style={{ color: textSecondary }}>
                                                {formatFecha(p.fecha_real_entrega)}
                                            </td>
                                            <td className="py-3">
                                                <span className="px-3 py-1 rounded-lg text-xs font-medium capitalize"
                                                    style={{ backgroundColor: estilo.bg, color: estilo.text }}>
                                                    {p.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default Dashboard;
