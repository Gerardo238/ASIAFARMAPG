import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Pencil, ShieldAlert, GitBranch, Ban, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLista, useCatalogo } from '../../hooks/useCatalogo';
import { Pagina, Encabezado, Tabla, Boton, Modal, Campo, Entrada, Selector, AreaTexto, Aviso, Insignia } from '../../components/ui';
import { useAvisos, useDialogoMotivo } from '../../hooks/useDialogos';
import { InsigniaSemaforo, InsigniaCondicion } from '../../components/insignias';
import { CONDICIONES_LOTE } from '../../utils/catalogos';
import { formatFecha, hoyISO } from '../../utils/fechas';
import { numero, mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';

const Lotes = () => {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const { datos: productos } = useLista('/productos');
    const { datos: laboratorios } = useCatalogo('laboratorios');
    const { datos: proveedores } = useCatalogo('proveedores');
    const { datos: ubicaciones } = useCatalogo('ubicaciones', { activos: true });
    const [filtros, setFiltros] = useState({ buscar: '', id_producto: '', id_laboratorio: '', id_proveedor: '', condicion: '', con_existencia: '1' });
    const [lotes, setLotes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [edicion, setEdicion] = useState(null);
    const [condicion, setCondicion] = useState(null);
    const [error, setError] = useState('');
    const [aviso, mostrar] = useAvisos();
    const [dialogo, pedirMotivo] = useDialogoMotivo();
    const esAdmin = puede(usuario, 'lotes.fechas');

    const cargar = useCallback(async () => {
        setCargando(true);
        const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
        try { setLotes((await api.get('/lotes', { params })).data); } finally { setCargando(false); }
    }, [filtros]);

    useEffect(() => { const t = setTimeout(cargar, 250); return () => clearTimeout(t); }, [cargar]);

    const abrirEdicion = (l) => {
        setError('');
        setEdicion({
            lote: l, numero_lote: l.numero_lote, id_laboratorio: l.id_laboratorio, id_ubicacion: l.id_ubicacion,
            costo_unitario: l.costo_unitario, fecha_fabricacion: l.fecha_fabricacion, fecha_vencimiento: l.fecha_vencimiento, motivo: ''
        });
    };

    const guardarEdicion = async (e) => {
        e.preventDefault();
        setError('');
        const { lote, ...datos } = edicion;
        if (datos.fecha_vencimiento <= datos.fecha_fabricacion) { setError('La fecha de vencimiento debe ser posterior a la de fabricación.'); return; }
        try {
            await api.put(`/lotes/${lote.id_lote}`, datos);
            setEdicion(null); mostrar('Lote actualizado. El cambio quedó en la auditoría.'); cargar();
        } catch (err) { setError(mensajeError(err)); }
    };

    const guardarCondicion = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post(`/lotes/${condicion.lote.id_lote}/condicion`, { condicion: condicion.nueva, motivo: condicion.motivo });
            setCondicion(null); mostrar(res.data.mensaje); cargar();
        } catch (err) { setError(mensajeError(err)); }
    };

    // Caso 9: un lote registrado por error se anula (no se borra) y se puede restaurar
    const anularORestaurar = async (l, restaurar) => {
        const motivo = await pedirMotivo(restaurar
            ? { titulo: `Restaurar lote ${l.numero_lote}`, confirmar: 'Restaurar', mensaje: 'El lote vuelve al inventario con la misma cantidad que tenía al anularse.' }
            : { titulo: `Anular lote ${l.numero_lote}`, confirmar: 'Anular lote', peligro: true, mensaje: 'Úsalo solo si el lote se registró por error (por ejemplo, duplicado). Deja de contar en la existencia y en FEFO, pero no se borra. No es posible si del lote ya salió producto.' });
        if (!motivo) return;
        try {
            const r = await api.post(`/lotes/${l.id_lote}/${restaurar ? 'restaurar' : 'anular'}`, { motivo });
            mostrar(r.data.mensaje); cargar();
        } catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const f = (campo) => ({ value: filtros[campo], onChange: e => setFiltros({ ...filtros, [campo]: e.target.value }) });

    return (
        <Pagina>
            {aviso}{dialogo}
            <Encabezado icono={Package} titulo="Lotes" color="#3D7EF6"
                subtitulo="Los lotes se crean desde Ingresos de compra y nunca se eliminan. Aquí se consultan, se corrigen (con motivo) y se cambia su condición." />

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                <Entrada className="col-span-2 md:col-span-6" placeholder="Buscar por nombre del producto, código, laboratorio o número de lote…" {...f('buscar')} />
                <Selector vacio="Todos los productos" {...f('id_producto')} opciones={productos.map(p => ({ value: p.id_producto, label: `${p.nombre} ${p.concentracion || ''}` }))} />
                <Selector vacio="Todos los laboratorios" {...f('id_laboratorio')} opciones={laboratorios.map(l => ({ value: l.id_laboratorio, label: l.nombre }))} />
                <Selector vacio="Todos los proveedores" {...f('id_proveedor')} opciones={proveedores.map(p => ({ value: p.id_proveedor, label: p.nombre }))} />
                <Selector vacio="Cualquier condición" {...f('condicion')} opciones={Object.entries(CONDICIONES_LOTE).map(([value, x]) => ({ value, label: x.label }))} />
                <Selector className="md:col-span-2" {...f('con_existencia')} opciones={[{ value: '1', label: 'Solo con existencia' }, { value: '', label: 'Todos (historial)' }]} />
            </div>

            <Tabla
                claveFila="id_lote"
                filas={lotes}
                cargando={cargando}
                vacio="No hay lotes con esos filtros."
                columnas={[
                    { clave: 'numero_lote', titulo: 'Lote', render: l => <span className="font-medium whitespace-nowrap" style={{ color: '#3D7EF6' }}>{l.numero_lote}</span> },
                    { clave: 'producto', titulo: 'Producto', render: l => `${l.Producto?.nombre} ${l.Producto?.concentracion || ''}` },
                    { clave: 'lab', titulo: 'Laboratorio', render: l => l.Laboratorio?.nombre },
                    { clave: 'prov', titulo: 'Proveedor', render: l => <div><div>{l.Ingreso?.Proveedor?.nombre}</div><div className="text-xs opacity-70">Fact. {l.Ingreso?.serie_factura}-{l.Ingreso?.numero_factura} · {formatFecha(l.Ingreso?.fecha_recepcion)}</div></div> },
                    { clave: 'venc', titulo: 'Vencimiento', render: l => <div className="space-y-1"><div>{formatFecha(l.fecha_vencimiento)}</div><InsigniaSemaforo semaforo={l.semaforo} /></div> },
                    { clave: 'disp', titulo: 'Disponible', alinear: 'right', render: l => <span><b>{numero(l.cantidad_disponible)}</b> <span className="text-xs opacity-60">/ {numero(l.cantidad_recibida)}</span></span> },
                    { clave: 'ubic', titulo: 'Ubicación', render: l => l.Ubicacion?.nombre },
                    { clave: 'cond', titulo: 'Condición', render: l => <div className="space-y-1"><InsigniaCondicion valor={l.condicion} />{l.condicion === 'disponible' && Number(l.cantidad_disponible) > 0 && !l.apto_despacho && <div><Insignia tono="amarillo">No apto para despacho</Insignia></div>}</div> },
                    {
                        clave: 'acciones', titulo: '', render: l => (
                            <div className="flex flex-col gap-1">
                                <Boton pequeno variante="secundario" icono={GitBranch} onClick={() => navigate(`/trazabilidad/lote/${l.id_lote}`)}>Rastrear</Boton>
                                {puede(usuario, 'lotes.editar') && l.condicion !== 'anulado' && <>
                                    <Boton pequeno variante="info" icono={Pencil} onClick={() => abrirEdicion(l)}>Corregir</Boton>
                                    {!['vencido'].includes(l.condicion) && <Boton pequeno variante="peligro" icono={ShieldAlert} onClick={() => { setError(''); setCondicion({ lote: l, nueva: l.condicion === 'disponible' ? 'cuarentena' : 'disponible', motivo: '' }); }}>Condición</Boton>}
                                </>}
                                {puede(usuario, 'lotes.anular') && Number(l.cantidad_disponible) === Number(l.cantidad_recibida) && l.condicion !== 'anulado' &&
                                    <Boton pequeno variante="peligro" icono={Ban} onClick={() => anularORestaurar(l, false)}>Anular</Boton>}
                                {puede(usuario, 'lotes.anular') && l.condicion === 'anulado' &&
                                    <Boton pequeno variante="exito" icono={RotateCcw} onClick={() => anularORestaurar(l, true)}>Restaurar</Boton>}
                            </div>
                        )
                    }
                ]}
            />

            <Modal abierto={!!edicion} titulo={`Corregir lote ${edicion?.lote.numero_lote || ''}`} alCerrar={() => setEdicion(null)}
                pie={<><Boton variante="secundario" onClick={() => setEdicion(null)}>Cancelar</Boton><Boton type="submit" form="form-lote">Guardar corrección</Boton></>}>
                {edicion && (
                    <form id="form-lote" onSubmit={guardarEdicion} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Aviso className="md:col-span-2">Las cantidades no se editan aquí: se corrigen con un ajuste en el Kárdex. Todo cambio queda registrado con tu usuario y el motivo.</Aviso>
                        <Campo etiqueta="Número de lote"><Entrada value={edicion.numero_lote} onChange={e => setEdicion({ ...edicion, numero_lote: e.target.value })} /></Campo>
                        <Campo etiqueta="Laboratorio">
                            <Selector value={edicion.id_laboratorio} onChange={e => setEdicion({ ...edicion, id_laboratorio: e.target.value })} opciones={laboratorios.map(l => ({ value: l.id_laboratorio, label: l.nombre }))} />
                        </Campo>
                        <Campo etiqueta="Fecha de fabricación" ayuda={!esAdmin ? 'Solo un administrador puede cambiar fechas.' : undefined}>
                            <Entrada type="date" max={hoyISO()} disabled={!esAdmin} value={edicion.fecha_fabricacion} onChange={e => setEdicion({ ...edicion, fecha_fabricacion: e.target.value })} />
                        </Campo>
                        <Campo etiqueta="Fecha de vencimiento">
                            <Entrada type="date" disabled={!esAdmin} min={edicion.fecha_fabricacion} value={edicion.fecha_vencimiento} onChange={e => setEdicion({ ...edicion, fecha_vencimiento: e.target.value })} />
                        </Campo>
                        <Campo etiqueta="Ubicación">
                            <Selector value={edicion.id_ubicacion} onChange={e => setEdicion({ ...edicion, id_ubicacion: e.target.value })} opciones={ubicaciones.map(u => ({ value: u.id_ubicacion, label: u.nombre }))} />
                        </Campo>
                        <Campo etiqueta="Costo unitario"><Entrada type="number" min="0" step="0.01" value={edicion.costo_unitario} onChange={e => setEdicion({ ...edicion, costo_unitario: e.target.value })} /></Campo>
                        <Campo etiqueta="Motivo de la corrección" obligatorio className="md:col-span-2">
                            <AreaTexto required value={edicion.motivo} onChange={e => setEdicion({ ...edicion, motivo: e.target.value })} placeholder="Ej. Error de digitación: la caja indica vencimiento 01/2029" />
                        </Campo>
                        {error && <Aviso tono="rojo" className="md:col-span-2">{error}</Aviso>}
                    </form>
                )}
            </Modal>

            <Modal abierto={!!condicion} titulo={`Condición del lote ${condicion?.lote.numero_lote || ''}`} alCerrar={() => setCondicion(null)} ancho="max-w-lg"
                pie={<><Boton variante="secundario" onClick={() => setCondicion(null)}>Cancelar</Boton><Boton type="submit" form="form-condicion">Cambiar condición</Boton></>}>
                {condicion && (
                    <form id="form-condicion" onSubmit={guardarCondicion} className="space-y-4">
                        <Aviso tono="amarillo">Un lote en cuarentena o bloqueado no se despacha. Usa "bloqueado" cuando un laboratorio o la autoridad sanitaria retire un lote del mercado.</Aviso>
                        <Campo etiqueta="Nueva condición">
                            <Selector value={condicion.nueva} onChange={e => setCondicion({ ...condicion, nueva: e.target.value })}
                                opciones={['disponible', 'cuarentena', 'bloqueado'].filter(x => x !== condicion.lote.condicion).map(x => ({ value: x, label: CONDICIONES_LOTE[x].label }))} />
                        </Campo>
                        <Campo etiqueta="Motivo" obligatorio><AreaTexto required value={condicion.motivo} onChange={e => setCondicion({ ...condicion, motivo: e.target.value })} /></Campo>
                        {error && <Aviso tono="rojo">{error}</Aviso>}
                    </form>
                )}
            </Modal>
        </Pagina>
    );
};

export default Lotes;
