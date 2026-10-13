import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FileText, ArrowLeft, Pencil, Truck, Ban, RotateCcw, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Pagina, Encabezado, Tarjeta, Tabla, Boton, DatoFicha, Insignia, BarraAvance } from '../../components/ui';
import { useDialogoMotivo, useAvisos } from '../../hooks/useDialogos';
import { InsigniaContrato, InsigniaPedido } from '../../components/insignias';
import { formatFecha } from '../../utils/fechas';
import { numero, moneda, mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';
import FormContrato from './FormContrato';

const ContratoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const [contrato, setContrato] = useState(null);
    const [editar, setEditar] = useState(false);
    const [dialogo, pedirMotivo] = useDialogoMotivo();
    const [aviso, mostrar] = useAvisos();

    const cargar = useCallback(() => api.get(`/contratos/${id}`).then(r => setContrato(r.data)), [id]);
    useEffect(() => { cargar(); }, [cargar]);

    if (!contrato) return <Pagina><p>Cargando...</p></Pagina>;

    const cambiarEstado = async (estado, titulo, mensaje) => {
        const motivo = await pedirMotivo({ titulo, mensaje, peligro: estado !== 'vigente', confirmar: titulo });
        if (!motivo) return;
        try { await api.post(`/contratos/${id}/estado`, { estado, motivo }); mostrar('Estado actualizado'); cargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const editable = !['anulado', 'cancelado', 'completado'].includes(contrato.estado);

    return (
        <Pagina>
            {aviso}{dialogo}
            <Encabezado icono={FileText} titulo={`Contrato ${contrato.numero_contrato}`} color="#C4467A" subtitulo={`NOG ${contrato.nog} · ${contrato.Institucion?.nombre}`}>
                {puede(usuario, 'pedidos.crear') && contrato.estado === 'vigente' &&
                    <Boton icono={Truck} onClick={() => navigate(`/pedidos?contrato=${contrato.id_contrato}`)}>Nuevo pedido</Boton>}
                {puede(usuario, 'contratos.escribir') && editable && <Boton variante="info" icono={Pencil} onClick={() => setEditar(true)}>Editar</Boton>}
                {puede(usuario, 'contratos.estado') && ['vigente', 'vencido'].includes(contrato.estado) && <>
                    <Boton variante="peligro" icono={XCircle} onClick={() => cambiarEstado('cancelado', 'Cancelar contrato', 'El contrato se da por terminado. Conserva sus entregas.')}>Cancelar</Boton>
                    <Boton variante="peligro" icono={Ban} onClick={() => cambiarEstado('anulado', 'Anular contrato', 'Solo es posible si no tiene entregas. Puede reactivarse después.')}>Anular</Boton>
                </>}
                {puede(usuario, 'contratos.estado') && ['cancelado', 'anulado'].includes(contrato.estado) &&
                    <Boton variante="exito" icono={RotateCcw} onClick={() => cambiarEstado('vigente', 'Reactivar contrato')}>Reactivar</Boton>}
                <Boton variante="secundario" icono={ArrowLeft} onClick={() => navigate('/contratos')}>Contratos</Boton>
            </Encabezado>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                <DatoFicha etiqueta="Estado" valor={<InsigniaContrato valor={contrato.estado} />} />
                <DatoFicha etiqueta="Modalidad" valor={contrato.ModalidadCompra?.nombre} />
                <DatoFicha etiqueta="Inicio" valor={formatFecha(contrato.fecha_inicio)} />
                <DatoFicha etiqueta="Fin" valor={`${formatFecha(contrato.fecha_fin)} (${contrato.dias_para_fin} d)`} />
                <DatoFicha etiqueta="Vida útil mínima" valor={contrato.vigencia_minima_meses != null ? `${contrato.vigencia_minima_meses} meses` : 'Parámetro general'} />
                <DatoFicha etiqueta="Monto" valor={moneda(contrato.monto_total)} />
                <DatoFicha etiqueta="Entregado" valor={moneda(contrato.monto_entregado)} />
                <DatoFicha etiqueta="Avance" valor={<BarraAvance porcentaje={contrato.porcentaje_avance} />} />
            </div>

            <Tarjeta titulo="Renglones y saldo">
                <Tabla
                    claveFila="id_detalle_contrato"
                    filas={contrato.renglones}
                    columnas={[
                        { clave: 'numero_renglon', titulo: 'Renglón', alinear: 'right' },
                        { clave: 'producto', titulo: 'Producto', render: r => <Link to={`/productos/${r.id_producto}`} style={{ color: '#2B8EA6' }}>{r.Producto?.nombre} {r.Producto?.concentracion}</Link> },
                        { clave: 'unidad', titulo: 'Unidad', render: r => r.Producto?.UnidadMedida?.nombre },
                        { clave: 'contratada', titulo: 'Contratado', alinear: 'right', render: r => numero(r.cantidad_contratada) },
                        { clave: 'pedida', titulo: 'Pedido', alinear: 'right', render: r => numero(r.cantidad_pedida) },
                        { clave: 'entregada', titulo: 'Entregado', alinear: 'right', render: r => numero(r.cantidad_entregada) },
                        { clave: 'saldo', titulo: 'Saldo por pedir', alinear: 'right', render: r => r.saldo_por_pedir > 0 ? <b>{numero(r.saldo_por_pedir)}</b> : <Insignia tono="verde">Completo</Insignia> },
                        { clave: 'precio', titulo: 'Precio', alinear: 'right', render: r => moneda(r.precio_unitario) },
                        { clave: 'subtotal', titulo: 'Subtotal', alinear: 'right', render: r => moneda(r.subtotal) }
                    ]}
                />
            </Tarjeta>

            <Tarjeta titulo="Pedidos del contrato" icono={Truck}>
                <Tabla
                    claveFila="id_pedido"
                    filas={contrato.pedidos}
                    alHacerClic={p => navigate(`/pedidos/${p.id_pedido}`)}
                    vacio="Sin pedidos."
                    columnas={[
                        { clave: 'numero_pedido', titulo: 'Pedido', render: p => <span style={{ color: '#2B8EA6' }}>{p.numero_pedido}</span> },
                        { clave: 'fecha_programada', titulo: 'Programada', render: p => formatFecha(p.fecha_programada) },
                        { clave: 'fecha_real_entrega', titulo: 'Entregado', render: p => formatFecha(p.fecha_real_entrega) },
                        { clave: 'monto', titulo: 'Monto', alinear: 'right', render: p => moneda(p.monto_total) },
                        { clave: 'estado', titulo: 'Estado', render: p => <InsigniaPedido valor={p.estado} /> }
                    ]}
                />
            </Tarjeta>

            {editar && <FormContrato contrato={contrato} alCerrar={() => setEditar(false)} alGuardar={() => { setEditar(false); mostrar('Contrato actualizado'); cargar(); }} />}
        </Pagina>
    );
};

export default ContratoDetalle;
