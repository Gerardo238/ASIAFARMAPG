import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Pill, X, Pencil, Trash2 } from 'lucide-react';
import { useColors } from '../../hooks/useColors';

const Productos = () => {
    const c = useColors();
    const [productos, setProductos] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState({
        codigo: '', nombre: '', descripcion: '',
        forma_farmaceutica: '', concentracion: '',
        unidad_medida: '', stock_minimo: 0
    });

    useEffect(() => { cargarProductos(); }, []);

    const cargarProductos = async () => {
        const res = await api.get('/productos');
        setProductos(res.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editando) {
            await api.put(`/productos/${editando}`, form);
        } else {
            await api.post('/productos', form);
        }
        setMostrarForm(false);
        setEditando(null);
        setForm({ codigo: '', nombre: '', descripcion: '', forma_farmaceutica: '', concentracion: '', unidad_medida: '', stock_minimo: 0 });
        cargarProductos();
    };

    const handleEditar = (p) => {
        setEditando(p.id_producto);
        setForm({
            codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion || '',
            forma_farmaceutica: p.forma_farmaceutica || '', concentracion: p.concentracion || '',
            unidad_medida: p.unidad_medida, stock_minimo: p.stock_minimo
        });
        setMostrarForm(true);
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este producto permanentemente?')) {
            await api.delete(`/productos/${id}`);
            cargarProductos();
        }
    };

    const handleCancelar = () => {
        setMostrarForm(false);
        setEditando(null);
        setForm({ codigo: '', nombre: '', descripcion: '', forma_farmaceutica: '', concentracion: '', unidad_medida: '', stock_minimo: 0 });
    };

    const inputStyle = {
        backgroundColor: c.inputBg, color: c.inputText,
        border: `1px solid ${c.inputBorder}`, width: '100%',
        borderRadius: '8px', padding: '8px 12px', outline: 'none'
    };

    const labelStyle = { color: c.textPrimary, fontWeight: '500', display: 'block', marginBottom: '4px' };

    return (
        <div className="p-8 min-h-screen" style={{ backgroundColor: c.bg }}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: '#1F2D6E18' }}>
                        <Pill size={24} style={{ color: '#1F2D6E' }} />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: c.textPrimary }}>Productos</h1>
                </div>
                <button onClick={() => { setMostrarForm(true); setEditando(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition"
                    style={{ backgroundColor: c.btnPrimary }}>
                    <Plus size={18} /> Nuevo Producto
                </button>
            </div>

            {mostrarForm && (
                <div className="rounded-xl shadow-sm p-6 mb-6" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold" style={{ color: c.textPrimary }}>
                            {editando ? 'Editar Producto' : 'Registrar Producto'}
                        </h2>
                        <button onClick={handleCancelar} style={{ color: c.textSecondary }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Código', key: 'codigo', type: 'text', required: true },
                            { label: 'Nombre', key: 'nombre', type: 'text', required: true },
                            { label: 'Forma Farmacéutica', key: 'forma_farmaceutica', type: 'text' },
                            { label: 'Concentración', key: 'concentracion', type: 'text' },
                            { label: 'Unidad de Medida', key: 'unidad_medida', type: 'text', required: true },
                            { label: 'Stock Mínimo', key: 'stock_minimo', type: 'number' },
                        ].map(({ label, key, type, required }) => (
                            <div key={key}>
                                <label style={labelStyle}>{label}</label>
                                <input type={type} value={form[key]} required={required}
                                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                                    style={inputStyle} />
                            </div>
                        ))}
                        <div className="col-span-2">
                            <label style={labelStyle}>Descripción</label>
                            <textarea value={form.descripcion} rows="2"
                                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                                style={inputStyle} />
                        </div>
                        <div className="col-span-2 flex gap-2">
                            <button type="submit" className="px-6 py-2 rounded-lg text-white transition"
                                style={{ backgroundColor: c.btnPrimary }}>
                                {editando ? 'Actualizar' : 'Guardar'}
                            </button>
                            <button type="button" onClick={handleCancelar}
                                className="px-6 py-2 rounded-lg transition"
                                style={{ backgroundColor: c.inputBg, color: c.textPrimary }}>
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
                            {['Código', 'Nombre', 'Forma Farmacéutica', 'Concentración', 'Unidad', 'Stock Mín.', 'Estado', 'Acciones'].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: c.tableHeaderText }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map((p) => (
                            <tr key={p.id_producto} style={{ backgroundColor: c.tableRow, borderBottom: `1px solid ${c.tableBorder}` }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = c.tableRowHover}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = c.tableRow}>
                                <td className="px-4 py-3 font-medium" style={{ color: '#2B8EA6' }}>{p.codigo}</td>
                                <td className="px-4 py-3" style={{ color: c.textPrimary }}>{p.nombre}</td>
                                <td className="px-4 py-3" style={{ color: c.textSecondary }}>{p.forma_farmaceutica}</td>
                                <td className="px-4 py-3" style={{ color: c.textSecondary }}>{p.concentracion}</td>
                                <td className="px-4 py-3" style={{ color: c.textSecondary }}>{p.unidad_medida}</td>
                                <td className="px-4 py-3" style={{ color: c.textSecondary }}>{p.stock_minimo}</td>
                                <td className="px-4 py-3">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium"
                                        style={{ backgroundColor: p.activo ? '#D1FAE5' : '#FEE2E2', color: p.activo ? '#065F46' : '#991B1B' }}>
                                        {p.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditar(p)}
                                            className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition"
                                            style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                                            <Pencil size={14} /> Editar
                                        </button>
                                        <button onClick={() => handleEliminar(p.id_producto)}
                                            className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition"
                                            style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                                            <Trash2 size={14} /> Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {productos.length === 0 && (
                    <div className="text-center py-12">
                        <Pill size={40} className="mx-auto mb-3 opacity-30" style={{ color: c.textSecondary }} />
                        <p style={{ color: c.textSecondary }}>No hay productos registrados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Productos;