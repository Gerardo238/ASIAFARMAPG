import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Truck } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLista } from '../../hooks/useCatalogo';
import { useColors } from '../../hooks/useColors';
import { Pagina, Encabezado, Tabla, Boton, Modal, Campo, Entrada, Selector, AreaTexto, Aviso, Insignia } from '../../components/ui';
import { useAvisos } from '../../hooks/useDialogos';
import { InsigniaPedido } from '../../components/insignias';
import { ESTADOS_PEDIDO } from '../../utils/catalogos';
import { formatFecha, hoyISO } from '../../utils/fechas';
import { numero, moneda, mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';

const Pedidos = () => {
    const c = useColors();
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [filtros, setFiltros] = useState({ estado: '', id_institucion: '', retrasados: '' });
    const consulta = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v)).toString();
    const { datos: pedidos, recargar, cargando } = useLista(`/pedidos${consulta ? `?${consulta}` : ''}`);
    const { datos: instituciones } = useLista('/instituciones');
    const { datos: contratos } = useLista('/contratos?estado=vigente');
    // Desde el detalle de un contrato se llega con ?contrato=ID: el formulario abre con ese contrato
    const [form, setForm] = useState(() => params.get('contrato')
        ? { id_contrato: params.get('contrato'), fecha_programada: '', observaciones: '', cantidades: {} }
        : null);
    const [error, setError] = useState('');
    const [aviso, mostrar] = useAvisos();

    const abrir = (idContrato = '') => {
        setError('');
        setForm({ id_contrato: String(idContrato), fecha_programada: '', observaciones: '', cantidades: {} });
    };

    useEffect(() => {
        if (params.get('contrato')) setParams({}, { replace: true });
    }, [params, setParams]);

    const contrato = contratos.find(x => String(x.id_contrato) === String(form?.id_contrato));
    const total = contrato ? contrato.renglones.reduce((s, r) => s + (Number(form.cantidades[r.id_detalle_contrato]) || 0) * Number(r.precio_unitario), 0) : 0;

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        const detalles = Object.entries(form.cantidades).filter(([, v]) => Number(v) > 0).map(([id_detalle_contrato, cantidad]) => ({ id_detalle_contrato, cantidad }));
        try {
            const res = await api.post('/pedidos', { id_contrato: form.id_contrato, fecha_programada: form.fecha_programada, observaciones: form.observaciones, detalles });
            setForm(null); mostrar(res.data.mensaje); recargar();
            navigate(`/pedidos/${res.data.pedido.id_pedido}`);
        } catch (err) { setError(mensajeError(err)); }
    };

    const f = (k) => ({ value: filtros[k], onChange: e => setFiltros({ ...filtros, [k]: e.target.value }) });

    return (
        <Pagina>
            {aviso}
            <Encabezado icono={Truck} titulo="Pedidos" color="#B85C4A"
                subtitulo="Entregas a instituciones bajo un contrato. El sistema elige los lotes (primero el que vence antes) y registra cada etapa del despacho.">
                {puede(usuario, 'pedidos.crear') && <Boton icono={Plus} onClick={() => abrir()}>Nuevo pedido</Boton>}
            </Encabezado>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <Selector vacio="Todos los estados" {...f('estado')} opciones={Object.entries(ESTADOS_PEDIDO).map(([value, x]) => ({ value, label: x.label }))} />
                <Selector vacio="Todas las instituciones" {...f('id_institucion')} opciones={instituciones.map(i => ({ value: i.id_institucion, label: i.nombre }))} />
                <Selector {...f('retrasados')} opciones={[{ value: '', label: 'Todos' }, { value: '1', label: 'Solo retrasados' }]} />
            </div>

            <Tabla
                claveFila="id_pedido"
                filas={pedidos}
                cargando={cargando}
                alHacerClic={p => navigate(`/pedidos/${p.id_pedido}`)}
                vacio="No hay pedidos."
                columnas={[
                    { clave: 'numero_pedido', titulo: 'Pedido', render: p => <span className="font-medium whitespace-nowrap" style={{ color: '#2B8EA6' }}>{p.numero_pedido}</span> },
                    { clave: 'inst', titulo: 'Institución', render: p => p.Contrato?.Institucion?.nombre },
                    { clave: 'contrato', titulo: 'Contrato / NOG', render: p => `${p.Contrato?.numero_contrato} · ${p.Contrato?.nog}` },
                    { clave: 'fecha_pedido', titulo: 'Fecha pedido', render: p => formatFecha(p.fecha_pedido) },
                    { clave: 'fecha_programada', titulo: 'Programada', render: p => formatFecha(p.fecha_programada) },
                    { clave: 'fecha_real_entrega', titulo: 'Entregado', render: p => formatFecha(p.fecha_real_entrega) },
                    { clave: 'monto', titulo: 'Monto', alinear: 'right', render: p => moneda(p.monto_total) },
                    {
                        clave: 'estado', titulo: 'Estado', render: p => (
                            <div className="flex flex-wrap gap-1"><InsigniaPedido valor={p.estado} />
                                {p.retrasado && <Insignia tono="rojo">{p.estado === 'entregado' ? `Entregado con ${p.dias_retraso} d de retraso` : `${p.dias_retraso} d de retraso`}</Insignia>}
                            </div>
                        )
                    }
                ]}
            />

            <Modal abierto={!!form} titulo="Nuevo pedido" alCerrar={() => setForm(null)} ancho="max-w-4xl"
                pie={<>
                    <span className="mr-auto self-center text-sm font-medium" style={{ color: c.textPrimary }}>Monto: {moneda(total)}</span>
                    <Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton>
                    <Boton type="submit" form="form-pedido" disabled={!contrato}>Crear pedido</Boton>
                </>}>
                {form && (
                    <form id="form-pedido" onSubmit={guardar} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Campo etiqueta="Contrato vigente" obligatorio className="md:col-span-2">
                                <Selector vacio="Seleccionar contrato" required value={form.id_contrato} onChange={e => setForm({ ...form, id_contrato: e.target.value, cantidades: {} })}
                                    opciones={contratos.map(x => ({ value: x.id_contrato, label: `${x.numero_contrato} · NOG ${x.nog} · ${x.Institucion?.nombre}` }))} />
                            </Campo>
                            <Campo etiqueta="Fecha programada de entrega" obligatorio>
                                <Entrada type="date" required min={hoyISO()} max={contrato?.fecha_fin} value={form.fecha_programada} onChange={e => setForm({ ...form, fecha_programada: e.target.value })} />
                            </Campo>
                        </div>
                        {contrato && (
                            <div>
                                <p className="text-sm mb-2" style={{ color: c.textSecondary }}>Indica cuánto se pide de cada renglón. No puede exceder el saldo del contrato. Los lotes los asigna el sistema al preparar el pedido.</p>
                                <Tabla
                                    claveFila="id_detalle_contrato"
                                    filas={contrato.renglones}
                                    columnas={[
                                        { clave: 'numero_renglon', titulo: 'Renglón' },
                                        { clave: 'producto', titulo: 'Producto', render: r => `${r.Producto?.nombre} ${r.Producto?.concentracion || ''}` },
                                        { clave: 'contratada', titulo: 'Contratado', alinear: 'right', render: r => numero(r.cantidad_contratada) },
                                        { clave: 'saldo', titulo: 'Saldo por pedir', alinear: 'right', render: r => <b>{numero(r.saldo_por_pedir)}</b> },
                                        { clave: 'precio', titulo: 'Precio', alinear: 'right', render: r => moneda(r.precio_unitario) },
                                        {
                                            clave: 'cantidad', titulo: 'Cantidad a pedir', render: r => (
                                                <div className="w-32">
                                                    <Entrada type="number" min="0" max={r.saldo_por_pedir} step="any" disabled={r.saldo_por_pedir <= 0}
                                                        value={form.cantidades[r.id_detalle_contrato] || ''}
                                                        onChange={e => setForm({ ...form, cantidades: { ...form.cantidades, [r.id_detalle_contrato]: e.target.value } })} />
                                                </div>
                                            )
                                        }
                                    ]}
                                />
                            </div>
                        )}
                        {contratos.length === 0 && <Aviso tono="amarillo">No hay contratos vigentes.</Aviso>}
                        <Campo etiqueta="Observaciones"><AreaTexto value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} /></Campo>
                        {error && <Aviso tono="rojo">{error}</Aviso>}
                    </form>
                )}
            </Modal>
        </Pagina>
    );
};

export default Pedidos;
