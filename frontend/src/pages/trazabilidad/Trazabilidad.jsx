import { useState } from 'react';
import api from '../../services/api';
import { Search, Package, ArrowUpDown, Truck, Building2 } from 'lucide-react';
import { useColors } from '../../hooks/useColors';
import { formatFecha, diasRestantes } from '../../utils/fechas';
const Trazabilidad = () => {
    const c = useColors();
    const [busqueda, setBusqueda] = useState('');
    const [lote, setLote] = useState(null);
    const [movimientos, setMovimientos] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [error, setError] = useState('');
    const buscarLote = async (e) => {
        e.preventDefault();
        if (!busqueda.trim()) return;
        setBuscando(true);
        setError('');
        setLote(null);
        setMovimientos([]);
        try {
            const resLotes = await api.get('/lotes');
            const loteEncontrado = resLotes.data.find(l =>
                l.numero_lote.toLowerCase() === busqueda.toLowerCase()
            );
            if (!loteEncontrado) {
                setError('No se encontró ningún lote con ese número.');
                setBuscando(false);
                return;
            }
            setLote(loteEncontrado);
            const resMov = await api.get(`/movimientos/lote/${loteEncontrado.id_lote}`);
            setMovimientos(resMov.data);
        } catch (err) {
            setError('Error al buscar el lote. Intente nuevamente.');
        } finally {
            setBuscando(false);
        }
    };
    const getSemaforo = (fecha_vencimiento) => {
        const dias = diasRestantes(fecha_vencimiento);
        if (dias <= 30) return { color: '#991B1B', bg: '#FEE2E2', texto: `Crítico — ${dias} días` };
        if (dias <= 90) return { color: '#92400E', bg: '#FEF3C7', texto: `Alerta — ${dias} días` };
        return { color: '#065F46', bg: '#D1FAE5', texto: `Normal — ${dias} días` };
    };
    const inputStyle = { backgroundColor: c.inputBg, color: c.inputText, border: `1px solid ${c.inputBorder}`, borderRadius: '8px', padding: '10px 14px', outline: 'none' };
    return (
        <div className="p-8 min-h-screen" style={{ backgroundColor: c.bg }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl" style={{ backgroundColor: '#2B8EA618' }}>
                    <Search size={24} style={{ color: '#2B8EA6' }} />
                </div>
                <h1 className="text-3xl font-bold" style={{ color: c.textPrimary }}>Trazabilidad por Lote</h1>
            </div>
            {/* Buscador */}
            <div className="rounded-xl shadow-sm p-6 mb-6" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                <p className="text-sm mb-4" style={{ color: c.textSecondary }}>
                    Ingresa el número de lote para rastrear su recorrido completo desde el ingreso hasta la entrega.
                </p>
                <form onSubmit={buscarLote} className="flex gap-3">
                    <input
                        type="text"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Ej: H4577712"
                        style={{ ...inputStyle, flex: 1 }}
                    />
                    <button type="submit" disabled={buscando}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                        style={{ backgroundColor: '#1F2D6E' }}>
                        <Search size={18} />
                        {buscando ? 'Buscando...' : 'Rastrear'}
                    </button>
                </form>
                {error && (
                    <p className="mt-3 text-sm" style={{ color: '#991B1B' }}>{error}</p>
                )}
            </div>
            {/* Información del lote */}
            {lote && (
                <>
                    <div className="rounded-xl shadow-sm p-6 mb-6" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                        <div className="flex items-center gap-2 mb-4">
                            <Package size={20} style={{ color: '#1F2D6E' }} />
                            <h2 className="text-lg font-bold" style={{ color: c.textPrimary }}>Información del Lote</h2>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Número de Lote', value: lote.numero_lote },
                                { label: 'Producto', value: lote.Producto?.nombre },
                                { label: 'Código', value: lote.Producto?.codigo },
                                { label: 'Cantidad Inicial', value: lote.cantidad_inicial },
                                { label: 'Cantidad Disponible', value: lote.cantidad_disponible },
                                { label: 'Fecha Fabricación', value: formatFecha(lote.fecha_fabricacion) },
                                { label: 'Fecha Vencimiento', value: formatFecha(lote.fecha_vencimiento) },
                                { label: 'Estado', value: lote.estado },
                            ].map(item => (
                                <div key={item.label} className="rounded-xl p-4" style={{ backgroundColor: c.inputBg }}>
                                    <p className="text-xs font-medium mb-1" style={{ color: c.textSecondary }}>{item.label}</p>
                                    <p className="text-sm font-bold" style={{ color: c.textPrimary }}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                        {/* Semáforo */}
                        <div className="mt-4">
                            {(() => {
                                const sem = getSemaforo(lote.fecha_vencimiento);
                                return (
                                    <span className="px-4 py-2 rounded-xl text-sm font-medium"
                                        style={{ backgroundColor: sem.bg, color: sem.color }}>
                                        Semáforo de vencimiento: {sem.texto}
                                    </span>
                                );
                            })()}
                        </div>
                    </div>
                    {/* Historial de movimientos */}
                    <div className="rounded-xl shadow-sm p-6 mb-6" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                        <div className="flex items-center gap-2 mb-4">
                            <ArrowUpDown size={20} style={{ color: '#2B8EA6' }} />
                            <h2 className="text-lg font-bold" style={{ color: c.textPrimary }}>
                                Historial de Movimientos
                            </h2>
                            <span className="ml-auto text-xs px-2 py-1 rounded-lg"
                                style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                                {movimientos.length} registros
                            </span>
                        </div>
                        {movimientos.length === 0 ? (
                            <p className="text-center py-8 text-sm" style={{ color: c.textSecondary }}>
                                No hay movimientos registrados para este lote.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr style={{ backgroundColor: c.tableHeader }}>
                                            {['Tipo', 'Entrada', 'Salida', 'Saldo', 'Motivo', 'Fecha', 'Usuario'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-sm font-medium" style={{ color: c.tableHeaderText }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movimientos.map((m) => (
                                            <tr key={m.id_movimiento} style={{ backgroundColor: c.tableRow, borderBottom: `1px solid ${c.tableBorder}` }}>
                                                <td className="px-4 py-3">
                                                    <span className="px-3 py-1 rounded-full text-xs font-medium"
                                                        style={{
                                                            backgroundColor: m.tipo_movimiento === 'entrada' ? '#D1FAE5' : '#FEE2E2',
                                                            color: m.tipo_movimiento === 'entrada' ? '#065F46' : '#991B1B'
                                                        }}>
                                                        {m.tipo_movimiento === 'entrada' ? '↑ Entrada' : '↓ Salida'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium" style={{ color: '#065F46' }}>
                                                    {parseFloat(m.entrada) > 0 ? `+${m.entrada}` : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium" style={{ color: '#991B1B' }}>
                                                    {parseFloat(m.salida) > 0 ? `-${m.salida}` : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-bold" style={{ color: c.textPrimary }}>{m.saldo}</td>
                                                <td className="px-4 py-3 text-sm" style={{ color: c.textSecondary }}>{m.motivo || '—'}</td>
                                                <td className="px-4 py-3 text-sm" style={{ color: c.textSecondary }}>
                                                    {formatFecha(m.fecha_movimiento)}
                                                </td>
                                                <td className="px-4 py-3 text-sm" style={{ color: c.textSecondary }}>
                                                    {m.Usuario?.nombre} {m.Usuario?.apellido}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
export default Trazabilidad;
