import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowUpDown } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLista, useCatalogo } from '../../hooks/useCatalogo';
import { Pagina, Encabezado, Tabla, Boton, Modal, Campo, Entrada, Selector, AreaTexto, Aviso, Insignia } from '../../components/ui';
import { useAvisos } from '../../hooks/useDialogos';
import { formatFecha, formatFechaHora } from '../../utils/fechas';
import { numero, mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';

const Movimientos = () => {
    const { usuario } = useAuth();
    const { datos: productos } = useLista('/productos');
    const { datos: motivos } = useCatalogo('motivos-movimiento', { activos: true });
    const [filtros, setFiltros] = useState({ id_producto: '', tipo: '', id_motivo: '', desde: '', hasta: '' });
    const [movimientos, setMovimientos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [form, setForm] = useState(null);
    const [lotesProducto, setLotesProducto] = useState([]);
    const [error, setError] = useState('');
    const [aviso, mostrar] = useAvisos();

    const cargar = useCallback(async () => {
        const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
        try { setMovimientos((await api.get('/movimientos', { params })).data); } finally { setCargando(false); }
    }, [filtros]);

    useEffect(() => { cargar(); }, [cargar]);

    // Al elegir el producto del ajuste se cargan solo sus lotes
    useEffect(() => {
        if (!form?.id_producto) return;
        api.get('/lotes', { params: { id_producto: form.id_producto } })
            .then(r => setLotesProducto(r.data.filter(l => l.condicion !== 'anulado' && String(l.id_producto) === String(form.id_producto))));
    }, [form?.id_producto]);

    const manuales = motivos.filter(m => !m.sistema);
    const motivoSel = manuales.find(m => String(m.id_motivo) === String(form?.id_motivo));

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/movimientos/ajuste', { id_lote: form.id_lote, id_motivo: form.id_motivo, cantidad: form.cantidad, observacion: form.observacion });
            setForm(null); mostrar('Ajuste registrado'); cargar();
        } catch (err) { setError(mensajeError(err)); }
    };

    const f = (campo) => ({ value: filtros[campo], onChange: e => setFiltros({ ...filtros, [campo]: e.target.value }) });

    return (
        <Pagina>
            {aviso}
            <Encabezado icono={ArrowUpDown} titulo="Kárdex de inventario" color="#3D7EF6"
                subtitulo="Todas las entradas y salidas por lote. Las compras se registran en Ingresos y las ventas salen de Pedidos; aquí solo se registran ajustes.">
                {puede(usuario, 'movimientos.ajuste') && <Boton icono={Plus} onClick={() => { setError(''); setForm({ id_producto: '', id_lote: '', id_motivo: '', cantidad: '', observacion: '' }); }}>Registrar ajuste</Boton>}
            </Encabezado>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <Selector vacio="Todos los productos" {...f('id_producto')} opciones={productos.map(p => ({ value: p.id_producto, label: `${p.nombre} ${p.concentracion || ''}` }))} />
                <Selector vacio="Entradas y salidas" {...f('tipo')} opciones={[{ value: 'entrada', label: 'Entradas' }, { value: 'salida', label: 'Salidas' }]} />
                <Selector vacio="Todos los motivos" {...f('id_motivo')} opciones={motivos.map(m => ({ value: m.id_motivo, label: m.nombre }))} />
                <Entrada type="date" title="Desde" {...f('desde')} />
                <Entrada type="date" title="Hasta" {...f('hasta')} />
            </div>

            <Tabla
                claveFila="id_movimiento"
                filas={movimientos}
                cargando={cargando}
                vacio="No hay movimientos con esos filtros."
                columnas={[
                    { clave: 'fecha', titulo: 'Fecha', render: m => formatFechaHora(m.fecha_movimiento) },
                    { clave: 'producto', titulo: 'Producto', render: m => m.Lote?.Producto?.nombre },
                    { clave: 'lote', titulo: 'Lote', render: m => <Link className="whitespace-nowrap" to={`/trazabilidad/lote/${m.id_lote}`} style={{ color: '#3D7EF6' }}>{m.Lote?.numero_lote}</Link> },
                    { clave: 'motivo', titulo: 'Motivo', render: m => <Insignia tono={m.tipo_movimiento === 'entrada' ? 'verde' : 'rojo'}>{m.tipo_movimiento === 'entrada' ? '↑' : '↓'} {m.MotivoMovimiento?.nombre}</Insignia> },
                    { clave: 'cantidad', titulo: 'Cantidad', alinear: 'right', render: m => <b style={{ color: m.tipo_movimiento === 'entrada' ? '#065F46' : '#991B1B' }}>{m.tipo_movimiento === 'entrada' ? '+' : '-'}{numero(m.cantidad)}</b> },
                    { clave: 'saldo', titulo: 'Saldo lote', alinear: 'right', render: m => numero(m.saldo) },
                    {
                        clave: 'ref', titulo: 'Origen / destino', render: m => m.Pedido
                            ? <div><Link to={`/pedidos/${m.Pedido.id_pedido}`} style={{ color: '#3D7EF6' }}>{m.Pedido.numero_pedido}</Link><div className="text-xs opacity-70">{m.Pedido.Contrato?.Institucion?.nombre} · Contrato {m.Pedido.Contrato?.numero_contrato}</div></div>
                            : m.Ingreso ? `Factura ${m.Ingreso.serie_factura}-${m.Ingreso.numero_factura}` : <span className="text-xs">{m.observacion}</span>
                    },
                    { clave: 'usuario', titulo: 'Usuario', render: m => m.Usuario ? `${m.Usuario.nombre} ${m.Usuario.apellido}` : 'Sistema' }
                ]}
            />

            <Modal abierto={!!form} titulo="Registrar ajuste de inventario" alCerrar={() => setForm(null)}
                pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton type="submit" form="form-ajuste">Registrar</Boton></>}>
                {form && (
                    <form id="form-ajuste" onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Aviso className="md:col-span-2">Usa ajustes solo para merma, daño, destrucción por vencimiento, devoluciones o diferencias de conteo físico.</Aviso>
                        <Campo etiqueta="Producto" obligatorio>
                            <Selector vacio="Seleccionar" required value={form.id_producto} onChange={e => setForm({ ...form, id_producto: e.target.value, id_lote: '' })}
                                opciones={productos.map(p => ({ value: p.id_producto, label: `${p.nombre} ${p.concentracion || ''}` }))} />
                        </Campo>
                        <Campo etiqueta="Lote" obligatorio>
                            <Selector vacio="Seleccionar lote" required value={form.id_lote} onChange={e => setForm({ ...form, id_lote: e.target.value })}
                                opciones={lotesProducto.map(l => ({ value: l.id_lote, label: `${l.numero_lote} · ${l.Laboratorio?.nombre} · vence ${formatFecha(l.fecha_vencimiento)} · disp. ${numero(l.cantidad_disponible)}` }))} />
                        </Campo>
                        <Campo etiqueta="Motivo" obligatorio>
                            <Selector vacio="Seleccionar motivo" required value={form.id_motivo} onChange={e => setForm({ ...form, id_motivo: e.target.value })}
                                opciones={manuales.map(m => ({ value: m.id_motivo, label: `${m.tipo === 'entrada' ? '↑ Entrada' : '↓ Salida'} · ${m.nombre}` }))} />
                        </Campo>
                        <Campo etiqueta={motivoSel ? `Cantidad (${motivoSel.tipo})` : 'Cantidad'} obligatorio>
                            <Entrada type="number" min="0.01" step="any" required value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} />
                        </Campo>
                        <Campo etiqueta="Observación" obligatorio className="md:col-span-2" ayuda="Detalla qué pasó (ej. acta de destrucción No. 15, conteo del 10/10).">
                            <AreaTexto required value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} />
                        </Campo>
                        {error && <Aviso tono="rojo" className="md:col-span-2">{error}</Aviso>}
                    </form>
                )}
            </Modal>
        </Pagina>
    );
};

export default Movimientos;
