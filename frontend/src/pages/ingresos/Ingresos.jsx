import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PackagePlus, Trash2, Eye, Ban, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLista, useCatalogo } from '../../hooks/useCatalogo';
import { useColors } from '../../hooks/useColors';
import { Pagina, Encabezado, Tabla, Boton, Modal, Campo, Entrada, Selector, Aviso, DatoFicha } from '../../components/ui';
import { useDialogoMotivo, useAvisos } from '../../hooks/useDialogos';
import { InsigniaIngreso, InsigniaCondicion } from '../../components/insignias';
import { formatFecha, hoyISO } from '../../utils/fechas';
import { numero, moneda, mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';
import Adjuntos from '../../components/Adjuntos';
import { subirAdjunto, ACEPTA } from '../../utils/adjuntos';

const LINEA_VACIA = { id_producto: '', id_laboratorio: '', numero_lote: '', fecha_fabricacion: '', fecha_vencimiento: '', cantidad: '', costo_unitario: '', id_ubicacion: '' };

const sumarMeses = (iso, meses) => {
    const [a, m, d] = iso.split('-').map(Number);
    const f = new Date(a, m - 1 + meses, d);
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
};

// Validación inmediata de la línea (el backend vuelve a validar todo)
const problemaLinea = (l, vigenciaMinima) => {
    const hoy = hoyISO();
    if (l.fecha_fabricacion && l.fecha_fabricacion > hoy) return 'La fabricación no puede ser futura.';
    if (l.fecha_fabricacion && l.fecha_vencimiento && l.fecha_vencimiento <= l.fecha_fabricacion) return 'Vence antes de fabricarse.';
    if (l.fecha_vencimiento && l.fecha_vencimiento < sumarMeses(hoy, vigenciaMinima)) return `Menos de ${vigenciaMinima} meses de vida útil.`;
    return null;
};

const Ingresos = () => {
    const c = useColors();
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const { datos: ingresos, recargar, cargando } = useLista('/ingresos');
    const { datos: proveedores } = useCatalogo('proveedores', { activos: true });
    const { datos: laboratorios } = useCatalogo('laboratorios', { activos: true });
    const { datos: ubicaciones } = useCatalogo('ubicaciones', { activos: true });
    const { datos: productos } = useLista('/productos', { activos: true });
    const { datos: parametros } = useLista('/catalogos/parametros');
    const vigenciaMinima = Number(parametros.find(p => p.clave === 'VIGENCIA_MINIMA_INGRESO_MESES')?.valor || 12);
    // Ubicación por defecto de cada lote nuevo (se aplica aunque la lista cargue después de abrir el formulario)
    const ubicacionPorDefecto = String((ubicaciones.find(u => u.nombre === 'Bodega general') || ubicaciones[0])?.id_ubicacion || '');

    const [form, setForm] = useState(null);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [detalle, setDetalle] = useState(null);
    const [archivoFactura, setArchivoFactura] = useState(null);
    const [dialogo, pedirMotivo] = useDialogoMotivo();
    const [aviso, mostrar] = useAvisos();

    const nuevo = () => {
        setError('');
        setForm({
            id_proveedor: '', serie_factura: '', numero_factura: '', fecha_factura: hoyISO(), fecha_recepcion: hoyISO(), observaciones: '',
            lotes: [{ ...LINEA_VACIA }]
        });
    };

    const cambiarLinea = (i, campo, valor) => {
        const lotes = form.lotes.map((l, j) => j === i ? { ...l, [campo]: valor } : l);
        setForm({ ...form, lotes });
    };

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        const conProblema = form.lotes.map((l, i) => [i, problemaLinea(l, vigenciaMinima)]).find(([, p]) => p);
        if (conProblema) { setError(`Línea ${conProblema[0] + 1}: ${conProblema[1]}`); return; }
        setGuardando(true);
        try {
            const res = await api.post('/ingresos', { ...form, lotes: form.lotes.map(l => ({ ...l, id_ubicacion: l.id_ubicacion || ubicacionPorDefecto })) });
            // La foto o PDF de la factura se adjunta después de crear el ingreso
            let nota = '';
            if (archivoFactura) {
                try { await subirAdjunto('ingresos', res.data.ingreso.id_ingreso, archivoFactura, 'Factura'); nota = ' La factura quedó adjunta.'; }
                catch (err) { nota = ` No se pudo adjuntar la factura (${err.response ? mensajeError(err) : err.message}); puedes adjuntarla desde el detalle.`; }
            }
            setForm(null);
            setArchivoFactura(null);
            mostrar(res.data.mensaje + nota, nota.startsWith(' No') ? 'amarillo' : 'verde');
            recargar();
        } catch (err) { setError(mensajeError(err)); }
        finally { setGuardando(false); }
    };

    const verDetalle = async (i) => setDetalle((await api.get(`/ingresos/${i.id_ingreso}`)).data);

    const anular = async (i) => {
        const motivo = await pedirMotivo({
            titulo: `Anular factura ${i.serie_factura}-${i.numero_factura}`, peligro: true, confirmar: 'Anular ingreso',
            mensaje: 'Sus lotes saldrán del inventario. Solo es posible si todavía no se ha despachado nada de esos lotes. Se puede restaurar después.'
        });
        if (!motivo) return;
        try { await api.post(`/ingresos/${i.id_ingreso}/anular`, { motivo }); mostrar('Ingreso anulado'); recargar(); setDetalle(null); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const restaurar = async (i) => {
        const motivo = await pedirMotivo({ titulo: `Restaurar factura ${i.serie_factura}-${i.numero_factura}`, confirmar: 'Restaurar', mensaje: 'Los lotes de esta factura volverán al inventario.' });
        if (!motivo) return;
        try { await api.post(`/ingresos/${i.id_ingreso}/restaurar`, { motivo }); mostrar('Ingreso restaurado'); recargar(); setDetalle(null); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const total = form ? form.lotes.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.costo_unitario) || 0), 0) : 0;

    return (
        <Pagina>
            {aviso}{dialogo}
            <Encabezado icono={PackagePlus} titulo="Ingresos de compra" color="#3D7EF6"
                subtitulo="Cada factura de proveedor ingresa uno o varios lotes nuevos. Es la única forma de agregar producto al inventario.">
                {puede(usuario, 'ingresos.crear') && <Boton icono={Plus} onClick={nuevo}>Registrar ingreso</Boton>}
            </Encabezado>

            <Tabla
                claveFila="id_ingreso"
                filas={ingresos}
                cargando={cargando}
                alHacerClic={verDetalle}
                vacio="No hay ingresos registrados."
                columnas={[
                    { clave: 'fecha_recepcion', titulo: 'Recepción', render: i => formatFecha(i.fecha_recepcion) },
                    { clave: 'factura', titulo: 'Factura', render: i => <span className="font-medium whitespace-nowrap" style={{ color: '#3D7EF6' }}>{i.serie_factura}-{i.numero_factura}</span> },
                    { clave: 'fecha_factura', titulo: 'Fecha factura', render: i => formatFecha(i.fecha_factura) },
                    { clave: 'proveedor', titulo: 'Proveedor', render: i => <div><div>{i.Proveedor?.nombre}</div><div className="text-xs opacity-70">NIT {i.Proveedor?.nit}</div></div> },
                    { clave: 'lotes', titulo: 'Lotes', alinear: 'right', render: i => i.total_lotes },
                    { clave: 'monto', titulo: 'Monto', alinear: 'right', render: i => moneda(i.monto_total) },
                    { clave: 'usuario', titulo: 'Registró', render: i => `${i.Usuario?.nombre || ''} ${i.Usuario?.apellido || ''}` },
                    { clave: 'estado', titulo: 'Estado', render: i => <InsigniaIngreso valor={i.estado} /> },
                    { clave: 'ver', titulo: '', render: () => <Boton pequeno variante="info" icono={Eye}>Ver</Boton> }
                ]}
            />

            {/* Nuevo ingreso */}
            <Modal abierto={!!form} titulo="Registrar ingreso de compra" alCerrar={() => setForm(null)} ancho="max-w-7xl"
                pie={<>
                    <span className="mr-auto self-center text-sm font-medium" style={{ color: c.textPrimary }}>Total factura: {moneda(total)}</span>
                    <Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton>
                    <Boton type="submit" form="form-ingreso" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar ingreso'}</Boton>
                </>}>
                {form && (
                    <form id="form-ingreso" onSubmit={guardar}>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
                            <Campo etiqueta="Proveedor" obligatorio className="md:col-span-2">
                                <Selector vacio="Seleccionar proveedor" required value={form.id_proveedor} onChange={e => setForm({ ...form, id_proveedor: e.target.value })}
                                    opciones={proveedores.map(p => ({ value: p.id_proveedor, label: `${p.nombre} (NIT ${p.nit})` }))} />
                            </Campo>
                            <Campo etiqueta="Serie" obligatorio><Entrada required value={form.serie_factura} onChange={e => setForm({ ...form, serie_factura: e.target.value })} /></Campo>
                            <Campo etiqueta="No. factura" obligatorio><Entrada required value={form.numero_factura} onChange={e => setForm({ ...form, numero_factura: e.target.value })} /></Campo>
                            <div />
                            <Campo etiqueta="Fecha de la factura" obligatorio><Entrada type="date" required max={hoyISO()} value={form.fecha_factura} onChange={e => setForm({ ...form, fecha_factura: e.target.value })} /></Campo>
                            <Campo etiqueta="Fecha de recepción" obligatorio ayuda="Día en que el producto entró a bodega."><Entrada type="date" required max={hoyISO()} value={form.fecha_recepcion} onChange={e => setForm({ ...form, fecha_recepcion: e.target.value })} /></Campo>
                            <Campo etiqueta="Observaciones" className="md:col-span-2"><Entrada value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} /></Campo>
                            <Campo etiqueta="Foto o PDF de la factura" ayuda={archivoFactura ? archivoFactura.name : 'Opcional. En el teléfono abre la cámara.'}>
                                <label className="af-campo flex items-center justify-center gap-2 h-[38px] rounded-lg text-[13px] cursor-pointer" style={{ border: `1px dashed ${c.inputBorder}`, color: c.textPrimary }}>
                                    {archivoFactura ? 'Cambiar archivo' : 'Elegir o tomar foto'}
                                    <input type="file" accept={ACEPTA} hidden onChange={e => setArchivoFactura(e.target.files[0] || null)} />
                                </label>
                            </Campo>
                        </div>
                        {proveedores.length === 0 && <Aviso tono="amarillo" className="mb-4">No hay proveedores registrados. Agrégalos en Catálogos → Proveedores.</Aviso>}

                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold" style={{ color: c.textPrimary }}>Lotes de la factura</h3>
                            <span className="text-xs" style={{ color: c.textSecondary }}>Vida útil mínima al ingresar: {vigenciaMinima} meses (vencer el {formatFecha(sumarMeses(hoyISO(), vigenciaMinima))} o después)</span>
                        </div>
                        <div className="space-y-3">
                            {form.lotes.map((l, i) => {
                                const problema = problemaLinea(l, vigenciaMinima);
                                return (
                                    <div key={i} className="rounded-xl p-3 grid grid-cols-2 md:grid-cols-12 gap-2 items-end" style={{ backgroundColor: c.inputBg, border: `1px solid ${problema ? '#FCA5A5' : c.inputBorder}` }}>
                                        <Campo etiqueta={`${i + 1}. Producto`} className="col-span-2 md:col-span-3">
                                            <Selector vacio="Seleccionar" required value={l.id_producto} onChange={e => cambiarLinea(i, 'id_producto', e.target.value)}
                                                opciones={productos.map(p => ({ value: p.id_producto, label: `${p.nombre} ${p.concentracion || ''} (${p.codigo})` }))} />
                                        </Campo>
                                        <Campo etiqueta="Laboratorio" className="md:col-span-2">
                                            <Selector vacio="Seleccionar" required value={l.id_laboratorio} onChange={e => cambiarLinea(i, 'id_laboratorio', e.target.value)}
                                                opciones={laboratorios.map(x => ({ value: x.id_laboratorio, label: x.nombre }))} />
                                        </Campo>
                                        <Campo etiqueta="No. lote" className="md:col-span-1"><Entrada required value={l.numero_lote} onChange={e => cambiarLinea(i, 'numero_lote', e.target.value)} /></Campo>
                                        <Campo etiqueta="Fabricación" className="md:col-span-1"><Entrada type="date" required max={hoyISO()} value={l.fecha_fabricacion} onChange={e => cambiarLinea(i, 'fecha_fabricacion', e.target.value)} /></Campo>
                                        <Campo etiqueta="Vencimiento" className="md:col-span-1"><Entrada type="date" required min={l.fecha_fabricacion || undefined} value={l.fecha_vencimiento} onChange={e => cambiarLinea(i, 'fecha_vencimiento', e.target.value)} /></Campo>
                                        <Campo etiqueta="Cantidad" className="md:col-span-1"><Entrada type="number" min="1" step="any" required value={l.cantidad} onChange={e => cambiarLinea(i, 'cantidad', e.target.value)} /></Campo>
                                        <Campo etiqueta="Costo unit." className="md:col-span-1"><Entrada type="number" min="0" step="0.01" value={l.costo_unitario} onChange={e => cambiarLinea(i, 'costo_unitario', e.target.value)} /></Campo>
                                        <Campo etiqueta="Ubicación" className="md:col-span-1">
                                            <Selector required value={l.id_ubicacion || ubicacionPorDefecto} onChange={e => cambiarLinea(i, 'id_ubicacion', e.target.value)}
                                                opciones={ubicaciones.map(u => ({ value: String(u.id_ubicacion), label: u.nombre }))} />
                                        </Campo>
                                        <div className="md:col-span-1 flex justify-end">
                                            <Boton pequeno variante="peligro" icono={Trash2} disabled={form.lotes.length === 1}
                                                onClick={() => setForm({ ...form, lotes: form.lotes.filter((_, j) => j !== i) })} aria-label="Quitar línea" />
                                        </div>
                                        {problema && <p className="col-span-2 md:col-span-12 text-xs font-medium" style={{ color: '#991B1B' }}>{problema}</p>}
                                    </div>
                                );
                            })}
                        </div>
                        <Boton variante="secundario" icono={Plus} className="mt-3"
                            onClick={() => setForm({ ...form, lotes: [...form.lotes, { ...LINEA_VACIA }] })}>
                            Agregar lote
                        </Boton>
                        {error && <Aviso tono="rojo" className="mt-4">{error}</Aviso>}
                    </form>
                )}
            </Modal>

            {/* Detalle */}
            <Modal abierto={!!detalle} titulo={detalle ? `Factura ${detalle.serie_factura}-${detalle.numero_factura}` : ''} alCerrar={() => setDetalle(null)} ancho="max-w-5xl"
                pie={detalle && puede(usuario, 'ingresos.anular') && (detalle.estado === 'registrado'
                    ? <Boton variante="peligro" icono={Ban} onClick={() => anular(detalle)}>Anular ingreso</Boton>
                    : <Boton variante="exito" icono={RotateCcw} onClick={() => restaurar(detalle)}>Restaurar ingreso</Boton>)}>
                {detalle && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                            <DatoFicha etiqueta="Proveedor" valor={`${detalle.Proveedor?.nombre} (NIT ${detalle.Proveedor?.nit})`} />
                            <DatoFicha etiqueta="Fecha factura / recepción" valor={`${formatFecha(detalle.fecha_factura)} / ${formatFecha(detalle.fecha_recepcion)}`} />
                            <DatoFicha etiqueta="Monto" valor={moneda(detalle.monto_total)} />
                            <DatoFicha etiqueta="Estado" valor={<InsigniaIngreso valor={detalle.estado} />} />
                        </div>
                        <Tabla
                            claveFila="id_lote"
                            filas={detalle.Lotes}
                            alHacerClic={l => navigate(`/trazabilidad/lote/${l.id_lote}`)}
                            columnas={[
                                { clave: 'producto', titulo: 'Producto', render: l => `${l.Producto?.nombre} ${l.Producto?.concentracion || ''}` },
                                { clave: 'lab', titulo: 'Laboratorio', render: l => l.Laboratorio?.nombre },
                                { clave: 'lote', titulo: 'Lote', render: l => <span className="whitespace-nowrap" style={{ color: '#3D7EF6' }}>{l.numero_lote}</span> },
                                { clave: 'fab', titulo: 'Fabricación', render: l => formatFecha(l.fecha_fabricacion) },
                                { clave: 'venc', titulo: 'Vencimiento', render: l => formatFecha(l.fecha_vencimiento) },
                                { clave: 'cant', titulo: 'Recibido', alinear: 'right', render: l => numero(l.cantidad_recibida) },
                                { clave: 'disp', titulo: 'Disponible', alinear: 'right', render: l => numero(l.cantidad_disponible) },
                                { clave: 'costo', titulo: 'Costo', alinear: 'right', render: l => moneda(l.costo_unitario) },
                                { clave: 'cond', titulo: 'Condición', render: l => <InsigniaCondicion valor={l.condicion} /> }
                            ]}
                        />
                        {detalle.observaciones && <p className="text-sm mt-3" style={{ color: c.textSecondary }}>Observaciones: {detalle.observaciones}</p>}
                        <div className="mt-5 -mx-6 -mb-6"><Adjuntos entidad="ingresos" id={detalle.id_ingreso} titulo="Factura adjunta" className="mb-0!" /></div>
                    </>
                )}
            </Modal>
        </Pagina>
    );
};

export default Ingresos;
