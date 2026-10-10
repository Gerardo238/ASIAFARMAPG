import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Truck, X, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { useColors } from '../../hooks/useColors';
import { formatFecha } from '../../utils/fechas';
const Pedidos = () => {
    const c = useColors();
    const [pedidos, setPedidos] = useState([]);
    const [contratos, setContratos] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({
        numero_pedido: '', id_contrato: '',
        fecha_programada: '', estado: 'pendiente', observaciones: ''
    });
    useEffect(() => { cargarPedidos(); cargarContratos(); }, []);
    const cargarPedidos = async () => { const res = await api.get('/pedidos'); setPedidos(res.data); };
    const cargarContratos = async () => { const res = await api.get('/contratos'); setContratos(res.data); };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editando) {
            await api.put(`/pedidos/${editando}`, form);
        } else {
            await api.post('/pedidos', form);
        }
        setMostrarForm(false); setEditando(null);
        setForm({ numero_pedido: '', id_contrato: '', fecha_programada: '', estado: 'pendiente', observaciones: '' });
        cargarPedidos();
    };
    const handleEditar = (p) => {
        setEditando(p.id_pedido);
        setForm({
            numero_pedido: p.numero_pedido,
            id_contrato: p.id_contrato,
            fecha_programada: p.fecha_programada ? p.fecha_programada.split('T')[0] : '',
            estado: p.estado,
            observaciones: p.observaciones || ''
        });
        setMostrarForm(true);
    };
    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este pedido permanentemente?')) {
            await api.delete(`/pedidos/${id}`); cargarPedidos();
        }
    };
    const handleCancelar = () => {
        setMostrarForm(false); setEditando(null);
        setForm({ numero_pedido: '', id_contrato: '', fecha_programada: '', estado: 'pendiente', observaciones: '' });
    };
    const registrarEntrega = async (id) => {
        await api.put(`/pedidos/${id}/entrega`); cargarPedidos();
    };
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
    const inputStyle = { backgroundColor: c.inputBg, color: c.inputText, border: `1px solid ${c.inputBorder}`, width: '100%', borderRadius: '8px', padding: '8px 12px', outline: 'none' };
    const labelStyle = { color: c.textPrimary, fontWeight: '500', display: 'block', marginBottom: '4px' };
    return (
        <div className="p-8 min-h-screen" style={{ backgroundColor: c.bg }}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: '#B85C4A18' }}>
                        <Truck size={24} style={{ color: '#B85C4A' }} />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: c.textPrimary }}>Pedidos</h1>
                </div>
                <button onClick={() => { setMostrarForm(true); setEditando(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: c.btnPrimary }}>
                    <Plus size={18} /> Nuevo Pedido
                </button>
            </div>
            {mostrarForm && (
                <div className="rounded-xl shadow-sm p-6 mb-6" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold" style={{ color: c.textPrimary }}>{editando ? 'Editar Pedido' : 'Registrar Pedido'}</h2>
                        <button onClick={handleCancelar} style={{ color: c.textSecondary }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div>
                            <label style={labelStyle}>Número de Pedido</label>
                            <input type="text" value={form.numero_pedido} onChange={e => setForm({ ...form, numero_pedido: e.target.value })} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Contrato</label>
                            <select value={form.id_contrato} onChange={e => setForm({ ...form, id_contrato: e.target.value })} style={inputStyle} required>
                                <option value="">Seleccionar contrato</option>
                                {contratos.map(cont => (
                                    <option key={cont.id_contrato} value={cont.id_contrato}>
                                        {cont.numero_contrato} - {cont.Institucion?.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha Programada</label>
                            <input type="date" value={form.fecha_programada} onChange={e => setForm({ ...form, fecha_programada: e.target.value })} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Estado</label>
                            <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} style={inputStyle}>
                                <option value="pendiente">Pendiente</option>
                                <option value="en_proceso">En Proceso</option>
                                <option value="despachado">Despachado</option>
                                <option value="entregado">Entregado</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label style={labelStyle}>Observaciones</label>
                            <textarea value={form.observaciones} rows="2" onChange={e => setForm({ ...form, observaciones: e.target.value })} style={inputStyle} />
                        </div>
                        <div className="col-span-2 flex gap-2">
                            <button type="submit" className="px-6 py-2 rounded-lg text-white" style={{ backgroundColor: c.btnPrimary }}>
                                {editando ? 'Actualizar' : 'Guardar'}
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
                            {['N° Pedido', 'Contrato', 'Fecha Programada', 'Fecha Real', 'Estado', 'Acciones'].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: c.tableHeaderText }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pedidos.map((p) => {
                            const est = getEstadoColor(p.estado);
                            return (
                                <tr key={p.id_pedido} style={{ backgroundColor: c.tableRow, borderBottom: `1px solid ${c.tableBorder}` }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = c.tableRowHover}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = c.tableRow}>
                                    <td className="px-4 py-3 font-medium" style={{ color: '#2B8EA6' }}>{p.numero_pedido}</td>
                                    <td className="px-4 py-3" style={{ color: c.textPrimary }}>{p.Contrato?.numero_contrato}</td>
                                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>{formatFecha(p.fecha_programada)}</td>
                                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>
                                        {formatFecha(p.fecha_real_entrega)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium capitalize" style={{ backgroundColor: est.bg, color: est.text }}>
                                            {p.estado}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            {p.estado !== 'entregado' && (
                                                <button onClick={() => registrarEntrega(p.id_pedido)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                                                    <CheckCircle size={14} /> Entregar
                                                </button>
                                            )}
                                            <button onClick={() => handleEditar(p)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                                                <Pencil size={14} /> Editar
                                            </button>
                                            <button onClick={() => handleEliminar(p.id_pedido)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                                                <Trash2 size={14} /> Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {pedidos.length === 0 && (
                    <div className="text-center py-12">
                        <Truck size={40} className="mx-auto mb-3 opacity-30" style={{ color: c.textSecondary }} />
                        <p style={{ color: c.textSecondary }}>No hay pedidos registrados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
export default Pedidos;

