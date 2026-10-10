import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Building2, X, Pencil, Trash2 } from 'lucide-react';
import { useColors } from '../../hooks/useColors';

const Instituciones = () => {
    const c = useColors();
    const [instituciones, setInstituciones] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({
        nombre: '', tipo: '', ruc: '',
        direccion: '', telefono: '', email: ''
    });

    useEffect(() => { cargarInstituciones(); }, []);

    const cargarInstituciones = async () => {
        const res = await api.get('/instituciones');
        setInstituciones(res.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editando) {
            await api.put(`/instituciones/${editando}`, form);
        } else {
            await api.post('/instituciones', form);
        }
        setMostrarForm(false); setEditando(null);
        setForm({ nombre: '', tipo: '', ruc: '', direccion: '', telefono: '', email: '' });
        cargarInstituciones();
    };

    const handleEditar = (i) => {
        setEditando(i.id_institucion);
        setForm({ nombre: i.nombre, tipo: i.tipo, ruc: i.ruc || '', direccion: i.direccion || '', telefono: i.telefono || '', email: i.email || '' });
        setMostrarForm(true);
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta institución permanentemente?')) {
            await api.delete(`/instituciones/${id}`); cargarInstituciones();
        }
    };

    const handleCancelar = () => {
        setMostrarForm(false); setEditando(null);
        setForm({ nombre: '', tipo: '', ruc: '', direccion: '', telefono: '', email: '' });
    };

    const inputStyle = { backgroundColor: c.inputBg, color: c.inputText, border: `1px solid ${c.inputBorder}`, width: '100%', borderRadius: '8px', padding: '8px 12px', outline: 'none' };
    const labelStyle = { color: c.textPrimary, fontWeight: '500', display: 'block', marginBottom: '4px' };

    return (
        <div className="p-8 min-h-screen" style={{ backgroundColor: c.bg }}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: '#C4467A18' }}>
                        <Building2 size={24} style={{ color: '#C4467A' }} />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: c.textPrimary }}>Instituciones</h1>
                </div>
                <button onClick={() => { setMostrarForm(true); setEditando(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: c.btnPrimary }}>
                    <Plus size={18} /> Nueva Institución
                </button>
            </div>

            {mostrarForm && (
                <div className="rounded-xl shadow-sm p-6 mb-6" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold" style={{ color: c.textPrimary }}>{editando ? 'Editar Institución' : 'Registrar Institución'}</h2>
                        <button onClick={handleCancelar} style={{ color: c.textSecondary }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div>
                            <label style={labelStyle}>Nombre</label>
                            <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo</label>
                            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={inputStyle} required>
                                <option value="">Seleccionar tipo</option>
                                <option value="publica">Pública</option>
                                <option value="privada">Privada</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>RUC</label>
                            <input type="text" value={form.ruc} onChange={e => setForm({ ...form, ruc: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Teléfono</label>
                            <input type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Dirección</label>
                            <input type="text" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} style={inputStyle} />
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
                            {['Nombre', 'Tipo', 'RUC', 'Teléfono', 'Email', 'Acciones'].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: c.tableHeaderText }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {instituciones.map((i) => (
                            <tr key={i.id_institucion} style={{ backgroundColor: c.tableRow, borderBottom: `1px solid ${c.tableBorder}` }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = c.tableRowHover}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = c.tableRow}>
                                <td className="px-4 py-3 font-medium" style={{ color: '#2B8EA6' }}>{i.nombre}</td>
                                <td className="px-4 py-3 capitalize" style={{ color: c.textPrimary }}>{i.tipo}</td>
                                <td className="px-4 py-3" style={{ color: c.textSecondary }}>{i.ruc}</td>
                                <td className="px-4 py-3" style={{ color: c.textSecondary }}>{i.telefono}</td>
                                <td className="px-4 py-3" style={{ color: c.textSecondary }}>{i.email}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditar(i)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                                            <Pencil size={14} /> Editar
                                        </button>
                                        <button onClick={() => handleEliminar(i.id_institucion)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                                            <Trash2 size={14} /> Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {instituciones.length === 0 && (
                    <div className="text-center py-12">
                        <Building2 size={40} className="mx-auto mb-3 opacity-30" style={{ color: c.textSecondary }} />
                        <p style={{ color: c.textSecondary }}>No hay instituciones registradas.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Instituciones;