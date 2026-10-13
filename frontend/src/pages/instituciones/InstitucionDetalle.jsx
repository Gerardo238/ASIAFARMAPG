import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowLeft, FileText, Truck } from 'lucide-react';
import api from '../../services/api';
import { Pagina, Encabezado, Tarjeta, Tabla, Boton, DatoFicha, Entrada } from '../../components/ui';
import { InsigniaContrato, InsigniaPedido } from '../../components/insignias';
import { formatFecha } from '../../utils/fechas';
import { numero, moneda } from '../../utils/formato';

const InstitucionDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [datos, setDatos] = useState(null);
    const [filtro, setFiltro] = useState('');

    useEffect(() => { api.get(`/instituciones/${id}/historial`).then(r => setDatos(r.data)); }, [id]);

    if (!datos) return <Pagina><p>Cargando...</p></Pagina>;
    const { institucion, contratos, entregas } = datos;
    const visibles = entregas.filter(e => !filtro || `${e.producto} ${e.numero_lote} ${e.laboratorio} ${e.numero_pedido}`.toLowerCase().includes(filtro.toLowerCase()));

    return (
        <Pagina>
            <Encabezado icono={Building2} titulo={institucion.nombre} color="#C4467A" subtitulo={`${institucion.TipoInstitucion?.nombre || ''} · ${institucion.departamento || ''}`}>
                <Boton variante="secundario" icono={ArrowLeft} onClick={() => navigate('/instituciones')}>Instituciones</Boton>
            </Encabezado>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <DatoFicha etiqueta="NIT" valor={institucion.nit} />
                <DatoFicha etiqueta="Unidad ejecutora" valor={institucion.unidad_ejecutora} />
                <DatoFicha etiqueta="Contacto" valor={`${institucion.contacto || '—'} ${institucion.telefono || ''}`} />
                <DatoFicha etiqueta="Contratos" valor={contratos.length} />
                <DatoFicha etiqueta="Unidades entregadas" valor={numero(entregas.filter(e => e.estado === 'entregado').reduce((s, e) => s + e.cantidad, 0))} />
            </div>

            <Tarjeta titulo="Contratos" icono={FileText}>
                <Tabla
                    claveFila="id_contrato"
                    filas={contratos}
                    alHacerClic={c => navigate(`/contratos/${c.id_contrato}`)}
                    vacio="Sin contratos."
                    columnas={[
                        { clave: 'numero_contrato', titulo: 'Contrato', render: c => <span style={{ color: '#2B8EA6' }}>{c.numero_contrato}</span> },
                        { clave: 'nog', titulo: 'NOG' },
                        { clave: 'modalidad', titulo: 'Modalidad', render: c => c.ModalidadCompra?.nombre },
                        { clave: 'vigencia', titulo: 'Vigencia', render: c => `${formatFecha(c.fecha_inicio)} – ${formatFecha(c.fecha_fin)}` },
                        { clave: 'monto', titulo: 'Monto', alinear: 'right', render: c => moneda(c.monto_total) },
                        { clave: 'estado', titulo: 'Estado', render: c => <InsigniaContrato valor={c.estado} /> }
                    ]}
                />
            </Tarjeta>

            <Tarjeta titulo="Productos entregados (con su lote)" icono={Truck}
                acciones={<div className="w-72"><Entrada placeholder="Filtrar por producto, lote, laboratorio..." value={filtro} onChange={e => setFiltro(e.target.value)} /></div>}>
                <Tabla
                    filas={visibles}
                    vacio="No se le ha despachado producto."
                    columnas={[
                        { clave: 'fecha', titulo: 'Fecha', render: e => formatFecha(e.fecha) },
                        { clave: 'pedido', titulo: 'Pedido', render: e => <Link to={`/pedidos/${e.id_pedido}`} style={{ color: '#2B8EA6' }}>{e.numero_pedido}</Link> },
                        { clave: 'contrato', titulo: 'Contrato / NOG', render: e => `${e.numero_contrato} · ${e.nog}` },
                        { clave: 'producto', titulo: 'Producto' },
                        { clave: 'lote', titulo: 'Lote', render: e => <Link className="whitespace-nowrap" to={`/trazabilidad/lote/${e.id_lote}`} style={{ color: '#2B8EA6' }}>{e.numero_lote}</Link> },
                        { clave: 'laboratorio', titulo: 'Laboratorio' },
                        { clave: 'venc', titulo: 'Vencimiento', render: e => formatFecha(e.fecha_vencimiento) },
                        { clave: 'cantidad', titulo: 'Cantidad', alinear: 'right', render: e => numero(e.cantidad) },
                        { clave: 'estado', titulo: 'Estado', render: e => <InsigniaPedido valor={e.estado} /> }
                    ]}
                />
            </Tarjeta>
        </Pagina>
    );
};

export default InstitucionDetalle;
