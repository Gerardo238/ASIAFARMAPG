import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pill, Pencil, Ban, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLista, useCatalogo } from '../../hooks/useCatalogo';
import { Pagina, Encabezado, Tabla, Boton, Modal, Campo, Entrada, Selector, AreaTexto, Aviso, Insignia } from '../../components/ui';
import { useDialogoMotivo, useAvisos } from '../../hooks/useDialogos';
import { InsigniaSemaforo, InsigniaActivo } from '../../components/insignias';
import { formatFecha } from '../../utils/fechas';
import { numero, mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';

const VACIO = { codigo: '', nombre: '', concentracion: '', id_forma_farmaceutica: '', id_unidad_medida: '', stock_minimo: 0, descripcion: '' };

const Productos = () => {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const { datos: productos, recargar, cargando } = useLista('/productos');
    const { datos: formas, recargar: recargarFormas } = useCatalogo('formas-farmaceuticas', { activos: true });
    const { datos: unidades, recargar: recargarUnidades } = useCatalogo('unidades-medida', { activos: true });
    // Alta rápida de una forma farmacéutica o unidad sin salir del formulario (solo administrador)
    const [alta, setAlta] = useState(null);
    const guardarAlta = async () => {
        if (!alta?.nombre.trim()) return;
        try {
            const r = await api.post(`/catalogos/${alta.catalogo}`, { nombre: alta.nombre.trim() });
            const nuevo = r.data.registro;
            if (alta.catalogo === 'formas-farmaceuticas') { await recargarFormas(); setForm(f => ({ ...f, id_forma_farmaceutica: String(nuevo.id_forma_farmaceutica) })); }
            else { await recargarUnidades(); setForm(f => ({ ...f, id_unidad_medida: String(nuevo.id_unidad_medida) })); }
            setAlta(null);
        } catch (err) { setError(mensajeError(err)); }
    };
    const enlaceAlta = (catalogo) => puede(usuario, 'catalogos.escribir') && (
        <button type="button" className="text-[11.5px] font-medium ml-2" style={{ color: '#3D7EF6' }} onClick={() => setAlta({ catalogo, nombre: '' })}>+ Nueva</button>
    );
    const campoAlta = (catalogo) => alta?.catalogo === catalogo && (
        <div className="flex gap-2 mt-2">
            <Entrada autoFocus placeholder={catalogo === 'formas-farmaceuticas' ? 'Ej. Solución oftálmica' : 'Ej. Ampolla'} value={alta.nombre}
                onChange={e => setAlta({ ...alta, nombre: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); guardarAlta(); } }} />
            <Boton pequeno onClick={guardarAlta}>Agregar</Boton>
            <Boton pequeno variante="secundario" onClick={() => setAlta(null)}>Cancelar</Boton>
        </div>
    );
    const [form, setForm] = useState(null);
    const [editando, setEditando] = useState(null);
    const [error, setError] = useState('');
    const [filtro, setFiltro] = useState('');
    const [verAnulados, setVerAnulados] = useState(false);
    const [dialogo, pedirMotivo] = useDialogoMotivo();
    const [aviso, mostrar] = useAvisos();

    const abrir = (p = null) => {
        setEditando(p?.id_producto || null);
        setError('');
        setForm(p ? {
            codigo: p.codigo, nombre: p.nombre, concentracion: p.concentracion || '', id_forma_farmaceutica: p.id_forma_farmaceutica,
            id_unidad_medida: p.id_unidad_medida, stock_minimo: p.stock_minimo, descripcion: p.descripcion || ''
        } : VACIO);
    };

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editando) await api.put(`/productos/${editando}`, form);
            else await api.post('/productos', form);
            setForm(null);
            mostrar(editando ? 'Producto actualizado' : 'Producto creado');
            recargar();
        } catch (err) { setError(mensajeError(err)); }
    };

    const anular = async (p) => {
        const motivo = await pedirMotivo({ titulo: `Anular ${p.nombre}`, peligro: true, confirmar: 'Anular', mensaje: 'El producto no se borra: deja de estar disponible para nuevas operaciones y conserva todo su historial. Puede restaurarse después.' });
        if (!motivo) return;
        try { await api.post(`/productos/${p.id_producto}/anular`, { motivo }); mostrar('Producto anulado'); recargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const restaurar = async (p) => {
        try { await api.post(`/productos/${p.id_producto}/restaurar`, {}); mostrar('Producto restaurado'); recargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const visibles = productos
        .filter(p => verAnulados || p.activo)
        .filter(p => !filtro || `${p.codigo} ${p.nombre} ${p.concentracion || ''}`.toLowerCase().includes(filtro.toLowerCase()));

    return (
        <Pagina>
            {aviso}{dialogo}
            <Encabezado icono={Pill} titulo="Productos" subtitulo="Cada producto aparece una sola vez; su existencia es la suma de todos sus lotes. Haz clic en un producto para ver sus lotes.">
                {puede(usuario, 'productos.escribir') && <Boton icono={Plus} onClick={() => abrir()}>Nuevo producto</Boton>}
            </Encabezado>

            <div className="flex flex-wrap gap-3 mb-4 items-center">
                <div className="w-80"><Entrada placeholder="Buscar por código o nombre..." value={filtro} onChange={e => setFiltro(e.target.value)} /></div>
                <label className="text-sm flex items-center gap-2" style={{ color: 'inherit' }}>
                    <input type="checkbox" checked={verAnulados} onChange={e => setVerAnulados(e.target.checked)} /> Mostrar anulados
                </label>
            </div>

            <Tabla
                claveFila="id_producto"
                filas={visibles}
                cargando={cargando}
                alHacerClic={p => navigate(`/productos/${p.id_producto}`)}
                vacio="No hay productos registrados."
                columnas={[
                    { clave: 'codigo', titulo: 'Código', render: p => <span className="font-medium whitespace-nowrap" style={{ color: '#3D7EF6' }}>{p.codigo}</span> },
                    { clave: 'nombre', titulo: 'Producto', render: p => <span className="font-medium">{p.nombre} {p.concentracion}</span> },
                    { clave: 'forma', titulo: 'Forma / unidad', render: p => `${p.FormaFarmaceutica?.nombre || ''} · ${p.UnidadMedida?.nombre || ''}` },
                    {
                        clave: 'existencia', titulo: 'Existencia', alinear: 'right', render: p => (
                            <div>
                                <span className="font-bold">{numero(p.existencia)}</span>
                                {/* Lo que está en bodega pero no se puede despachar (cuarentena, bloqueado, vencido), p. ej. una devolución en revisión */}
                                {p.existencia_retenida > 0 && <div className="text-[11px]" style={{ color: '#A16A00' }}>+{numero(p.existencia_retenida)} retenidas (cuarentena o vencidas)</div>}
                                {p.bajo_minimo && p.activo && <div><Insignia tono="rojo">Bajo mínimo ({numero(p.stock_minimo)})</Insignia></div>}
                            </div>
                        )
                    },
                    { clave: 'despachable', titulo: 'Apta despacho', alinear: 'right', render: p => numero(p.existencia_despachable) },
                    { clave: 'lotes', titulo: 'Lotes', alinear: 'right', render: p => `${p.lotes_con_existencia} / ${p.total_lotes}` },
                    { clave: 'proximo', titulo: 'Próximo vencimiento', render: p => p.proximo_vencimiento ? <div className="space-y-1"><div>{formatFecha(p.proximo_vencimiento)}</div><InsigniaSemaforo semaforo={p.semaforo} /></div> : '—' },
                    { clave: 'activo', titulo: 'Estado', render: p => <InsigniaActivo activo={p.activo} /> },
                    {
                        clave: 'acciones', titulo: '', render: p => (
                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                {puede(usuario, 'productos.escribir') && p.activo && <Boton pequeno variante="info" icono={Pencil} onClick={() => abrir(p)}>Editar</Boton>}
                                {puede(usuario, 'productos.anular') && (p.activo
                                    ? <Boton pequeno variante="peligro" icono={Ban} onClick={() => anular(p)}>Anular</Boton>
                                    : <Boton pequeno variante="exito" icono={RotateCcw} onClick={() => restaurar(p)}>Restaurar</Boton>)}
                            </div>
                        )
                    }
                ]}
            />

            <Modal abierto={!!form} titulo={editando ? 'Editar producto' : 'Nuevo producto'} alCerrar={() => setForm(null)}
                pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton type="submit" form="form-producto">Guardar</Boton></>}>
                {form && (
                    <form id="form-producto" onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Aviso className="md:col-span-2">Registra el producto genérico (ej. "Lidocaína 2% solución inyectable"). El laboratorio, el lote y las fechas se registran en cada <b>ingreso de compra</b>.</Aviso>
                        <Campo etiqueta="Código" obligatorio><Entrada value={form.codigo} required onChange={e => setForm({ ...form, codigo: e.target.value })} /></Campo>
                        <Campo etiqueta="Nombre genérico" obligatorio><Entrada value={form.nombre} required onChange={e => setForm({ ...form, nombre: e.target.value })} /></Campo>
                        <Campo etiqueta="Concentración"><Entrada value={form.concentracion} placeholder="Ej. 2%, 500 mg" onChange={e => setForm({ ...form, concentracion: e.target.value })} /></Campo>
                        <Campo etiqueta={<>Forma farmacéutica{enlaceAlta('formas-farmaceuticas')}</>} obligatorio>
                            <Selector vacio="Seleccionar" required value={form.id_forma_farmaceutica} onChange={e => setForm({ ...form, id_forma_farmaceutica: e.target.value })}
                                opciones={formas.map(f => ({ value: f.id_forma_farmaceutica, label: f.nombre }))} />
                            {campoAlta('formas-farmaceuticas')}
                        </Campo>
                        <Campo etiqueta={<>Unidad de medida{enlaceAlta('unidades-medida')}</>} obligatorio>
                            <Selector vacio="Seleccionar" required value={form.id_unidad_medida} onChange={e => setForm({ ...form, id_unidad_medida: e.target.value })}
                                opciones={unidades.map(u => ({ value: u.id_unidad_medida, label: u.nombre }))} />
                            {campoAlta('unidades-medida')}
                        </Campo>
                        <Campo etiqueta="Stock mínimo"><Entrada type="number" min="0" value={form.stock_minimo} onChange={e => setForm({ ...form, stock_minimo: e.target.value })} /></Campo>
                        <Campo etiqueta="Descripción" className="md:col-span-2"><AreaTexto value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></Campo>
                        {error && <Aviso tono="rojo" className="md:col-span-2">{error}</Aviso>}
                    </form>
                )}
            </Modal>
        </Pagina>
    );
};

export default Productos;
