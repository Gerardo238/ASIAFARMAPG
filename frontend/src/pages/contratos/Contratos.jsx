import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, FileText, X, Pencil, Trash2 } from 'lucide-react';
import { useColors } from '../../hooks/useColors';
import { formatFecha } from '../../utils/fechas';
const Contratos = () => {
    const c = useColors();
    const [contratos, setContratos] = useState([]);
    const [instituciones, setInstituciones] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({
        numero_contrato: '', id_institucion: '',
        fecha_inicio: '', fecha_fin: '',
        monto_total: '', estado: 'activo', observaciones: ''
    });
    useEffect(() => { cargarContratos(); cargarInstituciones(); }, []);
    const cargarContratos = async () => { const res = await api.get('/contratos'); setContratos(res.data); };
    const cargarInstituciones = async () => { const res = await api.get('/instituciones'); setInstituciones(res.data); };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editando) {
            await api.put(`/contratos/${editando}`, form);
        } else {
            await api.post('/contratos', form);
        }
        setMostrarForm(false); setEditando(null);
        setForm({ numero_contrato: '', id_institucion: '', fecha_inicio: '', fecha_fin: '', monto_total: '', estado: 'activo', observaciones: '' });
        cargarContratos();
    };
    const handleEditar = (cont) => {
        setEditando(cont.id_contrato);
        setForm({
            numero_contrato: cont.numero_contrato,
            id_institucion: cont.id_institucion,
            fecha_inicio: cont.fecha_inicio ? cont.fecha_inicio.split('T')[0] : '',
            fecha_fin: cont.fecha_fin ? cont.fecha_fin.split('T')[0] : '',
            monto_total: cont.monto_total,
            estado: cont.estado,
            observaciones: cont.observaciones || ''
        });
        setMostrarForm(true);
    };
    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este contrato permanentemente?')) {
            await api.delete(`/contratos/${id}`); cargarContratos();
        }
    };
    const handleCancelar = () => {
        setMostrarForm(false); setEditando(null);
        setForm({ numero_contrato: '', id_institucion: '', fecha_inicio: '', fecha_fin: '', monto_total: '', estado: 'activo', observaciones: '' });
    };
    const getEstadoColor = (estado) => {
        const colores = {
            activo: { bg: '#D1FAE5', text: '#065F46' },
            completado: { bg: '#DBEAFE', text: '#1E40AF' },
            vencido: { bg: '#FEE2E2', text: '#991B1B' },
            cancelado: { bg: '#F3F4F6', text: '#374151' }
        };
        return colores[estado] || { bg: '#F3F4F6', text: '#374151' };
    };
    const inputStyle = { backgroundColor: c.inputBg, color: c.inputText, border: `1px solid ${c.inputBorder}`, width: '100%', borderRadius: '8px', padding: '8px 12px', outline: 'none' };
    const labelStyle = { color: c.textPrimary, fontWeight: '500', display: 'block', marginBottom: '4px' };
    return (
        <div className="p-8 min-h-screen" style={{ backgroundColor: c.bg }}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: '#C4467A18' }}>
                        <FileText size={24} style={{ color: '#C4467A' }} />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: c.textPrimary }}>Contratos</h1>
                </div>
                <button onClick={() => { setMostrarForm(true); setEditando(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: c.btnPrimary }}>
                    <Plus size={18} /> Nuevo Contrato
                </button>
            </div>
            {mostrarForm && (
                <div className="rounded-xl shadow-sm p-6 mb-6" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold" style={{ color: c.textPrimary }}>{editando ? 'Editar Contrato' : 'Registrar Contrato'}</h2>
                        <button onClick={handleCancelar} style={{ color: c.textSecondary }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div>
                            <label style={labelStyle}>Número de Contrato</label>
                            <input type="text" value={form.numero_contrato} onChange={e => setForm({ ...form, numero_contrato: e.target.value })} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Institución</label>
                            <select value={form.id_institucion} onChange={e => setForm({ ...form, id_institucion: e.target.value })} style={inputStyle} required>
                                <option value="">Seleccionar institución</option>
                                {instituciones.map(i => <option key={i.id_institucion} value={i.id_institucion}>{i.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha Inicio</label>
                            <input type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha Fin</label>
                            <input type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Monto Total (Q)</label>
                            <input type="number" value={form.monto_total} onChange={e => setForm({ ...form, monto_total: e.target.value })} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Estado</label>
                            <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} style={inputStyle}>
                                <option value="activo">Activo</option>
                                <option value="completado">Completado</option>
                                <option value="vencido">Vencido</option>
                                <option value="cancelado">Cancelado</option>
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
                            {['N° Contrato', 'Institución', 'Fecha Inicio', 'Fecha Fin', 'Monto Total', 'Estado', 'Acciones'].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: c.tableHeaderText }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {contratos.map((cont) => {
                            const est = getEstadoColor(cont.estado);
                            return (
                                <tr key={cont.id_contrato} style={{ backgroundColor: c.tableRow, borderBottom: `1px solid ${c.tableBorder}` }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = c.tableRowHover}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = c.tableRow}>
                                    <td className="px-4 py-3 font-medium" style={{ color: '#2B8EA6' }}>{cont.numero_contrato}</td>
                                    <td className="px-4 py-3" style={{ color: c.textPrimary }}>{cont.Institucion?.nombre}</td>
                                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>{formatFecha(cont.fecha_inicio)}</td>
                                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>{formatFecha(cont.fecha_fin)}</td>
                                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>Q {parseFloat(cont.monto_total).toFixed(2)}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium capitalize" style={{ backgroundColor: est.bg, color: est.text }}>
                                            {cont.estado}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditar(cont)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                                                <Pencil size={14} /> Editar
                                            </button>
                                            <button onClick={() => handleEliminar(cont.id_contrato)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                                                <Trash2 size={14} /> Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {contratos.length === 0 && (
                    <div className="text-center py-12">
                        <FileText size={40} className="mx-auto mb-3 opacity-30" style={{ color: c.textSecondary }} />
                        <p style={{ color: c.textSecondary }}>No hay contratos registrados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
export default Contratos;

