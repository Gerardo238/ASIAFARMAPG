import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Package, X, Pencil, Trash2 } from 'lucide-react';
import { useColors } from '../../hooks/useColors';
import { formatFecha, diasRestantes } from '../../utils/fechas';
import { UBICACIONES_LOTE, etiquetaUbicacion } from '../../utils/catalogos';

// Vida útil mínima que debe tener un lote al ingresarlo (fase 1 del plan de
// correcciones). Debe coincidir con MESES_VIDA_UTIL_MINIMA del backend
// (backend/src/utils/validacionesLote.js); el backend valida siempre, esto
// solo evita que el usuario llene el formulario y lo envíe para nada.
const MESES_VIDA_UTIL_MINIMA = 7;

const FORM_VACIO = {
    id_producto: '', numero_lote: '', fecha_fabricacion: '',
    fecha_vencimiento: '', cantidad_inicial: '', ubicacion: 'en_bodega'
};

const Lotes = () => {
    const c = useColors();
    const [lotes, setLotes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(FORM_VACIO);
    const [errorForm, setErrorForm] = useState('');
    useEffect(() => { cargarLotes(); cargarProductos(); }, []);
    const cargarLotes = async () => { const res = await api.get('/lotes'); setLotes(res.data); };
    const cargarProductos = async () => { const res = await api.get('/productos'); setProductos(res.data); };

    // Validación en el navegador: evita enviar el formulario con fechas
    // inconsistentes. El backend vuelve a validar todo esto, así que ningún
    // lote puede quedar mal guardado aunque esta validación falle o se omita.
    const validarFechas = () => {
        if (!form.fecha_vencimiento) return null;
        const vencimiento = new Date(`${form.fecha_vencimiento}T00:00:00`);

        if (form.fecha_fabricacion) {
            const fabricacion = new Date(`${form.fecha_fabricacion}T00:00:00`);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (fabricacion > hoy) {
                return 'La fecha de fabricación no puede ser una fecha futura.';
            }
            if (vencimiento <= fabricacion) {
                return 'La fecha de vencimiento debe ser posterior a la fecha de fabricación.';
            }
        }

        if (!editando) {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const minimo = new Date(hoy);
            minimo.setMonth(minimo.getMonth() + MESES_VIDA_UTIL_MINIMA);
            if (vencimiento < minimo) {
                const fechaMinima = minimo.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
                return `El lote debe tener al menos ${MESES_VIDA_UTIL_MINIMA} meses de vigencia al ingresarlo (vencer después del ${fechaMinima}).`;
            }
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorForm('');

        const error = validarFechas();
        if (error) { setErrorForm(error); return; }

        try {
            if (editando) {
                await api.put(`/lotes/${editando}`, form);
            } else {
                await api.post('/lotes', { ...form, cantidad_disponible: form.cantidad_inicial });
            }
            setMostrarForm(false); setEditando(null);
            setForm(FORM_VACIO);
            cargarLotes();
        } catch (error) {
            // Si el backend rechaza el lote (por ejemplo, por la vida útil
            // mínima), se muestra su mensaje en vez de fallar en silencio.
            setErrorForm(error.response?.data?.mensaje || 'No se pudo guardar el lote. Intenta de nuevo.');
        }
    };
    const handleEditar = (l) => {
        setEditando(l.id_lote);
        setErrorForm('');
        setForm({
            id_producto: l.id_producto, numero_lote: l.numero_lote,
            fecha_fabricacion: l.fecha_fabricacion ? l.fecha_fabricacion.split('T')[0] : '',
            fecha_vencimiento: l.fecha_vencimiento ? l.fecha_vencimiento.split('T')[0] : '',
            cantidad_inicial: l.cantidad_inicial, ubicacion: l.ubicacion || 'en_bodega'
        });
        setMostrarForm(true);
    };
    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este lote permanentemente?')) {
            await api.delete(`/lotes/${id}`); cargarLotes();
        }
    };
    const handleCancelar = () => {
        setMostrarForm(false); setEditando(null); setErrorForm('');
        setForm(FORM_VACIO);
    };
    const getSemaforo = (fecha_vencimiento) => {
        const dias = diasRestantes(fecha_vencimiento);
        if (dias <= 30) return { badge: '#FEE2E2', text: '#991B1B', label: `Crítico (${dias} días)` };
        if (dias <= 90) return { badge: '#FEF3C7', text: '#92400E', label: `Alerta (${dias} días)` };
        return { badge: '#D1FAE5', text: '#065F46', label: `Normal (${dias} días)` };
    };
    const inputStyle = { backgroundColor: c.inputBg, color: c.inputText, border: `1px solid ${c.inputBorder}`, width: '100%', borderRadius: '8px', padding: '8px 12px', outline: 'none' };
    const labelStyle = { color: c.textPrimary, fontWeight: '500', display: 'block', marginBottom: '4px' };
    const hoyISO = new Date().toISOString().slice(0, 10);
    return (
        <div className="p-8 min-h-screen" style={{ backgroundColor: c.bg }}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: '#2B8EA618' }}>
                        <Package size={24} style={{ color: '#2B8EA6' }} />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: c.textPrimary }}>Lotes</h1>
                </div>
                <button onClick={() => { setMostrarForm(true); setEditando(null); setErrorForm(''); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: c.btnPrimary }}>
                    <Plus size={18} /> Nuevo Lote
                </button>
            </div>
            {mostrarForm && (
                <div className="rounded-xl shadow-sm p-6 mb-6" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold" style={{ color: c.textPrimary }}>{editando ? 'Editar Lote' : 'Registrar Lote'}</h2>
                        <button onClick={handleCancelar} style={{ color: c.textSecondary }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div>
                            <label style={labelStyle}>Producto</label>
                            <select value={form.id_producto} onChange={e => setForm({ ...form, id_producto: e.target.value })}
                                style={inputStyle} required>
                                <option value="">Seleccionar producto</option>
                                {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre} - {p.codigo}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Número de Lote</label>
                            <input type="text" value={form.numero_lote} onChange={e => setForm({ ...form, numero_lote: e.target.value })} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha de Fabricación</label>
                            <input type="date" value={form.fecha_fabricacion} max={hoyISO} onChange={e => setForm({ ...form, fecha_fabricacion: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha de Vencimiento</label>
                            <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Cantidad Inicial</label>
                            <input type="number" value={form.cantidad_inicial} onChange={e => setForm({ ...form, cantidad_inicial: e.target.value })} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación</label>
                            <select value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} style={inputStyle}>
                                {UBICACIONES_LOTE.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                            </select>
                        </div>
                        {errorForm && (
                            <div className="col-span-2 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                                {errorForm}
                            </div>
                        )}
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
                            {['Número Lote', 'Producto', 'Vencimiento', 'Cant. Inicial', 'Disponible', 'Ubicación', 'Estado', 'Semáforo', 'Acciones'].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: c.tableHeaderText }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {lotes.map((l) => {
                            const sem = getSemaforo(l.fecha_vencimiento);
                            return (
                                <tr key={l.id_lote} style={{ backgroundColor: c.tableRow, borderBottom: `1px solid ${c.tableBorder}` }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = c.tableRowHover}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = c.tableRow}>
                                    <td className="px-4 py-3 font-medium" style={{ color: '#2B8EA6' }}>{l.numero_lote}</td>
                                    <td className="px-4 py-3" style={{ color: c.textPrimary }}>{l.Producto?.nombre}</td>
                                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>{formatFecha(l.fecha_vencimiento)}</td>
                                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>{l.cantidad_inicial}</td>
                                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>{l.cantidad_disponible}</td>
                                    <td className="px-4 py-3" style={{ color: c.textSecondary }}>{etiquetaUbicacion(l.ubicacion)}</td>
                                    <td className="px-4 py-3 capitalize" style={{ color: c.textSecondary }}>{l.estado}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: sem.badge, color: sem.text }}>
                                            {sem.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditar(l)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                                                <Pencil size={14} /> Editar
                                            </button>
                                            <button onClick={() => handleEliminar(l.id_lote)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                                                <Trash2 size={14} /> Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {lotes.length === 0 && (
                    <div className="text-center py-12">
                        <Package size={40} className="mx-auto mb-3 opacity-30" style={{ color: c.textSecondary }} />
                        <p style={{ color: c.textSecondary }}>No hay lotes registrados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Lotes;
