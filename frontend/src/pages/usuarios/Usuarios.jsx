import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, User, X, Pencil, Trash2 } from 'lucide-react';
import { useColors } from '../../hooks/useColors';

const Usuarios = () => {
    const c = useColors();
    const [usuarios, setUsuarios] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({
        nombre: '', apellido: '', email: '',
        password: '', rol: '', activo: true
    });

    useEffect(() => { cargarUsuarios(); }, []);

    const cargarUsuarios = async () => {
        const res = await api.get('/auth/usuarios');
        setUsuarios(res.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editando) {
            await api.put(`/auth/usuarios/${editando}`, form);
        } else {
            await api.post('/auth/registro', form);
        }
        setMostrarForm(false);
        setEditando(null);
        setForm({ nombre: '', apellido: '', email: '', password: '', rol: '', activo: true });
        cargarUsuarios();
    };

    const handleEditar = (u) => {
        setEditando(u.id_usuario);
        setForm({
            nombre: u.nombre, apellido: u.apellido,
            email: u.email, password: '',
            rol: u.rol, activo: u.activo
        });
        setMostrarForm(true);
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este usuario permanentemente?')) {
            await api.delete(`/auth/usuarios/${id}`);
            cargarUsuarios();
        }
    };

    const handleCancelar = () => {
        setMostrarForm(false);
        setEditando(null);
        setForm({ nombre: '', apellido: '', email: '', password: '', rol: '', activo: true });
    };

    const getRolColor = (rol) => {
        const colores = {
            administrador: { bg: '#EDE9FE', text: '#5B21B6' },
            gerente: { bg: '#DBEAFE', text: '#1E40AF' },
            bodeguero: { bg: '#D1FAE5', text: '#065F46' },
            encargado_contratos: { bg: '#FEF3C7', text: '#92400E' }
        };
        return colores[rol] || { bg: '#F3F4F6', text: '#374151' };
    };

    const inputStyle = { backgroundColor: c.inputBg, color: c.inputText, border: `1px solid ${c.inputBorder}`, width: '100%', borderRadius: '8px', padding: '8px 12px', outline: 'none' };
    const labelStyle = { color: c.textPrimary, fontWeight: '500', display: 'block', marginBottom: '4px' };

    return (
        <div className="p-8 min-h-screen" style={{ backgroundColor: c.bg }}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: '#1F2D6E18' }}>
                        <User size={24} style={{ color: '#1F2D6E' }} />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: c.textPrimary }}>Usuarios</h1>
                </div>
                <button onClick={() => { setMostrarForm(true); setEditando(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: c.btnPrimary }}>
                    <Plus size={18} /> Nuevo Usuario
                </button>
            </div>

            {mostrarForm && (
                <div className="rounded-xl shadow-sm p-6 mb-6" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold" style={{ color: c.textPrimary }}>
                            {editando ? 'Editar Usuario' : 'Registrar Usuario'}
                        </h2>
                        <button onClick={handleCancelar} style={{ color: c.textSecondary }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div>
                            <label style={labelStyle}>Nombre</label>
                            <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Apellido</label>
                            <input type="text" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Correo Electrónico</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>{editando ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</label>
                            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} required={!editando} />
                        </div>
                        <div>
                            <label style={labelStyle}>Rol</label>
                            <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} style={inputStyle} required>
                                <option value="">Seleccionar rol</option>
                                <option value="administrador">Administrador</option>
                                <option value="gerente">Gerente</option>
                                <option value="bodeguero">Bodeguero</option>
                                <option value="encargado_contratos">Encargado de Contratos</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Estado</label>
                            <select value={form.activo} onChange={e => setForm({ ...form, activo: e.target.value === 'true' })} style={inputStyle}>
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
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
                            {['Nombre', 'Apellido', 'Correo', 'Rol', 'Estado', 'Acciones'].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: c.tableHeaderText }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map((u) => {
                            const rol = getRolColor(u.rol);
                            return (
                                <tr key={u.id_usuario} style={{ backgroundColor: c.tableRow, borderBottom: `1px solid ${c.tableBorder}` }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = c.tableRowHover}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = c.tableRow}>
                                    <td className="px-4 py-3 font-medium" style={{ color: c.textPrimary }}>{u.nombre}</td>
                                    <td className="px-4 py-3" style={{ color: c.textPrimary }}>{u.apellido}</td>
                                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>{u.email}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                                            style={{ backgroundColor: rol.bg, color: rol.text }}>
                                            {u.rol?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                                            style={{ backgroundColor: u.activo ? '#D1FAE5' : '#FEE2E2', color: u.activo ? '#065F46' : '#991B1B' }}>
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditar(u)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                                                <Pencil size={14} /> Editar
                                            </button>
                                            <button onClick={() => handleEliminar(u.id_usuario)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                                                <Trash2 size={14} /> Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {usuarios.length === 0 && (
                    <div className="text-center py-12">
                        <User size={40} className="mx-auto mb-3 opacity-30" style={{ color: c.textSecondary }} />
                        <p style={{ color: c.textSecondary }}>No hay usuarios registrados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Usuarios;