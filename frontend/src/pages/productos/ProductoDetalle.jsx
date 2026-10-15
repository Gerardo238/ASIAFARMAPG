import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Pill, ArrowLeft, Package, ArrowUpDown } from 'lucide-react';
import api from '../../services/api';
import { Pagina, Encabezado, Tarjeta, Tabla, Boton, DatoFicha, Insignia, Pestanas } from '../../components/ui';
import { InsigniaSemaforo, InsigniaCondicion } from '../../components/insignias';
import { formatFecha, formatFechaHora } from '../../utils/fechas';
import { numero, moneda } from '../../utils/formato';
import Adjuntos from '../../components/Adjuntos';

const ProductoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [datos, setDatos] = useState(null);
    const [pestana, setPestana] = useState('existencia');

    useEffect(() => { api.get(`/productos/${id}`).then(r => setDatos(r.data)); }, [id]);

    if (!datos) return <Pagina><p>Cargando...</p></Pagina>;
    const { producto, resumen, lotes, movimientos } = datos;
    const conExistencia = lotes.filter(l => Number(l.cantidad_disponible) > 0 && l.condicion !== 'anulado');
    const lotesVisibles = pestana === 'existencia' ? conExistencia : lotes;

    return (
        <Pagina>
            <Encabezado icono={Pill} titulo={`${producto.nombre} ${producto.concentracion || ''}`}
                subtitulo={`${producto.codigo} · ${producto.FormaFarmaceutica?.nombre} · ${producto.UnidadMedida?.nombre}`}>
                <Boton variante="secundario" icono={ArrowLeft} onClick={() => navigate('/productos')}>Productos</Boton>
            </Encabezado>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
                <DatoFicha etiqueta="Existencia disponible" valor={numero(resumen.existencia)} />
                <DatoFicha etiqueta="Apta para despacho" valor={numero(resumen.existencia_despachable)} />
                <DatoFicha etiqueta="Retenida (vencida/bloqueada/cuarentena)" valor={numero(resumen.existencia_retenida)} />
                <DatoFicha etiqueta="Lotes con existencia" valor={resumen.lotes_con_existencia} />
                <DatoFicha etiqueta="Stock mínimo" valor={numero(producto.stock_minimo)} />
                <DatoFicha etiqueta="Próximo vencimiento" valor={resumen.proximo_vencimiento ? formatFecha(resumen.proximo_vencimiento) : '—'} />
            </div>

            <Tarjeta titulo="Lotes del producto" icono={Package}
                acciones={<Pestanas activa={pestana} alCambiar={setPestana} pestanas={[
                    { clave: 'existencia', titulo: `Con existencia (${conExistencia.length})` },
                    { clave: 'todos', titulo: `Historial completo (${lotes.length})` }
                ]} />}>
                <p className="text-sm mb-3 opacity-70">Ordenados por fecha de vencimiento: el primero de la lista es el que el sistema despacha primero (FEFO).</p>
                <Tabla
                    claveFila="id_lote"
                    filas={lotesVisibles}
                    alHacerClic={l => navigate(`/trazabilidad/lote/${l.id_lote}`)}
                    vacio="Este producto no tiene lotes con existencia."
                    columnas={[
                        { clave: 'numero_lote', titulo: 'Lote', render: l => <span className="font-medium whitespace-nowrap" style={{ color: '#3D7EF6' }}>{l.numero_lote}</span> },
                        { clave: 'lab', titulo: 'Laboratorio', render: l => l.Laboratorio?.nombre },
                        { clave: 'prov', titulo: 'Proveedor / factura', render: l => <div><div>{l.Ingreso?.Proveedor?.nombre}</div><div className="text-xs opacity-70">Fact. {l.Ingreso?.serie_factura}-{l.Ingreso?.numero_factura}</div></div> },
                        { clave: 'fecha_recepcion', titulo: 'Ingreso', render: l => formatFecha(l.Ingreso?.fecha_recepcion) },
                        { clave: 'fab', titulo: 'Fabricación', render: l => formatFecha(l.fecha_fabricacion) },
                        { clave: 'venc', titulo: 'Vencimiento', render: l => <div className="space-y-1"><div>{formatFecha(l.fecha_vencimiento)}</div><InsigniaSemaforo semaforo={l.semaforo} /></div> },
                        { clave: 'recibida', titulo: 'Recibido', alinear: 'right', render: l => numero(l.cantidad_recibida) },
                        { clave: 'disp', titulo: 'Disponible', alinear: 'right', render: l => <b>{numero(l.cantidad_disponible)}</b> },
                        { clave: 'costo', titulo: 'Costo unit.', alinear: 'right', render: l => moneda(l.costo_unitario) },
                        { clave: 'ubic', titulo: 'Ubicación', render: l => l.Ubicacion?.nombre },
                        { clave: 'cond', titulo: 'Condición', render: l => <InsigniaCondicion valor={l.condicion} /> }
                    ]}
                />
            </Tarjeta>

            <Tarjeta titulo="Entradas y salidas (kárdex)" icono={ArrowUpDown}>
                <Tabla
                    claveFila="id_movimiento"
                    filas={movimientos}
                    vacio="Sin movimientos."
                    columnas={[
                        { clave: 'fecha', titulo: 'Fecha', render: m => formatFechaHora(m.fecha_movimiento) },
                        { clave: 'lote', titulo: 'Lote', render: m => <Link className="whitespace-nowrap" to={`/trazabilidad/lote/${m.id_lote}`} style={{ color: '#3D7EF6' }}>{m.Lote?.numero_lote}</Link> },
                        { clave: 'motivo', titulo: 'Motivo', render: m => m.MotivoMovimiento?.nombre },
                        { clave: 'entrada', titulo: 'Entrada', alinear: 'right', render: m => m.tipo_movimiento === 'entrada' ? <span style={{ color: '#065F46' }}>+{numero(m.cantidad)}</span> : '' },
                        { clave: 'salida', titulo: 'Salida', alinear: 'right', render: m => m.tipo_movimiento === 'salida' ? <span style={{ color: '#991B1B' }}>-{numero(m.cantidad)}</span> : '' },
                        { clave: 'saldo', titulo: 'Saldo lote', alinear: 'right', render: m => numero(m.saldo) },
                        { clave: 'ref', titulo: 'Referencia', render: m => m.Pedido ? <Link to={`/pedidos/${m.Pedido.id_pedido || m.id_pedido}`} style={{ color: '#3D7EF6' }}>{m.Pedido.numero_pedido}</Link> : (m.observacion || '') },
                        { clave: 'usuario', titulo: 'Usuario', render: m => m.Usuario ? `${m.Usuario.nombre} ${m.Usuario.apellido}` : <Insignia>Sistema</Insignia> }
                    ]}
                />
            </Tarjeta>

            <Adjuntos entidad="productos" id={producto.id_producto} titulo="Documentos del producto" tipoInicial="Registro sanitario"
                nota="Registro sanitario, ficha técnica u otros documentos del medicamento" />
        </Pagina>
    );
};

export default ProductoDetalle;
