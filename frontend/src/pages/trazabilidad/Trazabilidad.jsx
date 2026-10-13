import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Search, Eraser } from 'lucide-react';
import api from '../../services/api';
import { useLista, useCatalogo } from '../../hooks/useCatalogo';
import { Pagina, Encabezado, Tarjeta, Tabla, Boton, Campo, Entrada, Selector, Aviso } from '../../components/ui';
import { InsigniaSemaforo, InsigniaCondicion } from '../../components/insignias';
import { formatFecha } from '../../utils/fechas';
import { numero } from '../../utils/formato';

const VACIO = { id_laboratorio: '', id_producto: '', id_proveedor: '', id_institucion: '', numero_lote: '', desde: '', hasta: '' };

const Trazabilidad = () => {
    const navigate = useNavigate();
    const { datos: laboratorios } = useCatalogo('laboratorios');
    const { datos: proveedores } = useCatalogo('proveedores');
    const { datos: productos } = useLista('/productos');
    const { datos: instituciones } = useLista('/instituciones');
    const [filtros, setFiltros] = useState(VACIO);
    const [resultados, setResultados] = useState(null);
    const [buscando, setBuscando] = useState(false);

    const buscar = async (e) => {
        e?.preventDefault();
        setBuscando(true);
        const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
        try { setResultados((await api.get('/trazabilidad/buscar', { params })).data); } finally { setBuscando(false); }
    };

    const f = (campo) => ({ value: filtros[campo], onChange: e => setFiltros({ ...filtros, [campo]: e.target.value }) });

    return (
        <Pagina>
            <Encabezado icono={GitBranch} titulo="Trazabilidad" color="#2B8EA6"
                subtitulo="Rastrea un lote hacia atrás (laboratorio, proveedor, factura) y hacia adelante (instituciones, contratos y pedidos que lo recibieron)." />

            <Tarjeta titulo="Buscar lotes" icono={Search}>
                <form onSubmit={buscar} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Campo etiqueta="Laboratorio fabricante">
                        <Selector vacio="Todos" {...f('id_laboratorio')} opciones={laboratorios.map(l => ({ value: l.id_laboratorio, label: l.nombre }))} />
                    </Campo>
                    <Campo etiqueta="Producto">
                        <Selector vacio="Todos" {...f('id_producto')} opciones={productos.map(p => ({ value: p.id_producto, label: `${p.nombre} ${p.concentracion || ''}` }))} />
                    </Campo>
                    <Campo etiqueta="Proveedor">
                        <Selector vacio="Todos" {...f('id_proveedor')} opciones={proveedores.map(p => ({ value: p.id_proveedor, label: p.nombre }))} />
                    </Campo>
                    <Campo etiqueta="Institución que lo recibió">
                        <Selector vacio="Todas" {...f('id_institucion')} opciones={instituciones.map(i => ({ value: i.id_institucion, label: i.nombre }))} />
                    </Campo>
                    <Campo etiqueta="Número de lote"><Entrada placeholder="Ej. BY24-001" {...f('numero_lote')} /></Campo>
                    <Campo etiqueta="Comprado desde"><Entrada type="date" {...f('desde')} /></Campo>
                    <Campo etiqueta="Comprado hasta"><Entrada type="date" {...f('hasta')} /></Campo>
                    <div className="flex items-end gap-2">
                        <Boton type="submit" icono={Search} disabled={buscando}>{buscando ? 'Buscando...' : 'Buscar'}</Boton>
                        <Boton variante="secundario" icono={Eraser} onClick={() => { setFiltros(VACIO); setResultados(null); }}>Limpiar</Boton>
                    </div>
                </form>
                <Aviso className="mt-4">Ejemplo: para saber qué lidocaína de Bayer recibió el Hospital de Chiquimula, elige laboratorio "Bayer", producto "Lidocaína" e institución "Hospital Nacional de Chiquimula".</Aviso>
            </Tarjeta>

            {resultados && (
                <Tarjeta titulo={`${resultados.length} lote(s) encontrados`}>
                    <Tabla
                        claveFila="id_lote"
                        filas={resultados}
                        alHacerClic={l => navigate(`/trazabilidad/lote/${l.id_lote}`)}
                        vacio="Ningún lote coincide con la búsqueda."
                        columnas={[
                            { clave: 'numero_lote', titulo: 'Lote', render: l => <span className="font-medium whitespace-nowrap" style={{ color: '#2B8EA6' }}>{l.numero_lote}</span> },
                            { clave: 'producto', titulo: 'Producto', render: l => `${l.Producto?.nombre} ${l.Producto?.concentracion || ''}` },
                            { clave: 'lab', titulo: 'Laboratorio', render: l => l.Laboratorio?.nombre },
                            { clave: 'prov', titulo: 'Proveedor / factura', render: l => <div><div>{l.Ingreso?.Proveedor?.nombre}</div><div className="text-xs opacity-70">Fact. {l.Ingreso?.serie_factura}-{l.Ingreso?.numero_factura} · {formatFecha(l.Ingreso?.fecha_recepcion)}</div></div> },
                            { clave: 'venc', titulo: 'Vencimiento', render: l => <div className="space-y-1"><div>{formatFecha(l.fecha_vencimiento)}</div><InsigniaSemaforo semaforo={l.semaforo} /></div> },
                            { clave: 'recibido', titulo: 'Recibido', alinear: 'right', render: l => numero(l.cantidad_recibida) },
                            { clave: 'despachado', titulo: 'Despachado', alinear: 'right', render: l => numero(l.cantidad_despachada) },
                            { clave: 'disponible', titulo: 'En bodega', alinear: 'right', render: l => numero(l.cantidad_disponible) },
                            { clave: 'inst', titulo: 'Instituciones', render: l => l.instituciones.join(', ') || '—' },
                            { clave: 'cond', titulo: 'Condición', render: l => <InsigniaCondicion valor={l.condicion} /> }
                        ]}
                    />
                </Tarjeta>
            )}
        </Pagina>
    );
};

export default Trazabilidad;
