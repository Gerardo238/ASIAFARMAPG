import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, ArrowUpDown, X } from 'lucide-react';
import { useColors } from '../../hooks/useColors';
import { formatFecha } from '../../utils/fechas';
const Movimientos = () => {
    const c = useColors();
    const [movimientos, setMovimientos] = useState([]);
    const [lotes, setLotes] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [form, setForm] = useState({
        id_lote: '', tipo_movimiento: 'entrada',
        entrada: '', salida: '', motivo: ''
    });
    useEffect(() => { cargarMovimientos(); cargarLotes(); }, []);
    const cargarMovimientos = async () => {
        const res = await api.get('/movimientos');
        setMovimientos(res.data);
    };
    const cargarLotes = async () => {
        const res = await api.get('/lotes');
        setLotes(res.data);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const datos = {
            id_lote: form.id_lote,
            tipo_movimiento: form.tipo_movimiento,
            entrada: form.tipo_movimiento === 'entrada' ? parseFloat(form.entrada || 0) : 0,
            salida: form.tipo_movimiento === 'salida' ? parseFloat(form.salida || 0) : 0,
            motivo: form.motivo
        };
        await api.post('/movimientos', datos);
        setMostrarForm(false);
        setForm({ id_lote: '', tipo_movimiento: 'entrada', entrada: '', salida: '', motivo: '' });
        cargarMovimientos();
        cargarLotes();
    };
    const handleCancelar = () => {
        setMostrarForm(false);
        setForm({ id_lote: '', tipo_movimiento: 'entrada', entrada: '', salida: '', motivo: '' });
    };
    const inputStyle = { backgroundColor: c.inputBg, color: c.inputText, border: `1px solid ${c.inputBorder}`, width: '100%', borderRadius: '8px', padding: '8px 12px', outline: 'none' };
    const labelStyle = { color: c.textPrimary, fontWeight: '500', display: 'block', marginBottom: '4px' };
    return (
        <div className="p-8 min-h-screen" style={{ backgroundColor: c.bg }}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: '#2B8EA618' }}>
                        <ArrowUpDown size={24} style={{ color: '#2B8EA6' }} />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: c.textPrimary }}>Movimientos de Inventario</h1>
                </div>
                <button onClick={() => setMostrarForm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: c.btnPrimary }}>
                    <Plus size={18} /> Nuevo Movimiento
                </button>
            </div>
            {mostrarForm && (
                <div className="rounded-xl shadow-sm p-6 mb-6" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold" style={{ color: c.textPrimary }}>Registrar Movimiento</h2>
                        <button onClick={handleCancelar} style={{ color: c.textSecondary }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div>
                            <label style={labelStyle}>Lote</label>
                            <select value={form.id_lote} onChange={e => setForm({ ...form, id_lote: e.target.value })} style={inputStyle} required>
                                <option value="">Seleccionar lote</option>
                                {lotes.map(l => (
                                    <option key={l.id_lote} value={l.id_lote}>
                                        {l.numero_lote} — {l.Producto?.nombre} (Disponible: {l.cantidad_disponible})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo de Movimiento</label>
                            <select value={form.tipo_movimiento} onChange={e => setForm({ ...form, tipo_movimiento: e.target.value })} style={inputStyle} required>
                                <option value="entrada">Entrada</option>
                                <option value="salida">Salida</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>
                                {form.tipo_movimiento === 'entrada' ? 'Cantidad de Entrada' : 'Cantidad de Salida'}
                            </label>
                            <input
                                type="number"
                                value={form.tipo_movimiento === 'entrada' ? form.entrada : form.salida}
                                onChange={e => setForm({
                                    ...form,
                                    entrada: form.tipo_movimiento === 'entrada' ? e.target.value : '',
                                    salida: form.tipo_movimiento === 'salida' ? e.target.value : ''
                                })}
                                style={inputStyle}
                                required
                                min="1"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Motivo</label>
                            <input type="text" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} style={inputStyle} placeholder="Ej: Compra a proveedor, Despacho pedido..." />
                        </div>
                        <div className="col-span-2 flex gap-2">
                            <button type="submit" className="px-6 py-2 rounded-lg text-white" style={{ backgroundColor: c.btnPrimary }}>
                                Registrar
                            </button>
                            <button type="button" onClick={handleCancelar} className="px-6 py-2 rounded-lg" style={{ backgroundColor: c.inputBg, color: c.textPrimary }}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <div className="rounded-xl shadow-sm overflow-hidden" style={{ border: `1px solid ${c.cardBorder}` }}>
                <table className="w-full">
                    <thead>
                        <tr style={{ backgroundColor: c.tableHeader }}>
                            {['Lote', 'Producto', 'Tipo', 'Entrada', 'Salida', 'Saldo', 'Motivo', 'Fecha', 'Usuario'].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-medium text-sm" style={{ color: c.tableHeaderText }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {movimientos.map((m) => (
                            <tr key={m.id_movimiento} style={{ backgroundColor: c.tableRow, borderBottom: `1px solid ${c.tableBorder}` }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = c.tableRowHover}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = c.tableRow}>
                                <td className="px-4 py-3 text-sm font-medium" style={{ color: '#2B8EA6' }}>{m.Lote?.numero_lote}</td>
                                <td className="px-4 py-3 text-sm" style={{ color: c.textPrimary }}>{m.Lote?.Producto?.nombre}</td>
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
                {movimientos.length === 0 && (
                    <div className="text-center py-12">
                        <ArrowUpDown size={40} className="mx-auto mb-3 opacity-30" style={{ color: c.textSecondary }} />
                        <p style={{ color: c.textSecondary }}>No hay movimientos registrados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
export default Movimientos;

