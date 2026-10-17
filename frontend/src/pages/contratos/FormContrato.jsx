import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useLista, useCatalogo } from '../../hooks/useCatalogo';
import { useColors } from '../../hooks/useColors';
import { Modal, Boton, Campo, Entrada, Selector, AreaTexto, Aviso } from '../../components/ui';
import { moneda, mensajeError } from '../../utils/formato';

const RENGLON_VACIO = { id_producto: '', cantidad_contratada: '', precio_unitario: '' };

// Formulario de contrato (crear y editar). contrato = null para uno nuevo.
const FormContrato = ({ contrato, alCerrar, alGuardar }) => {
    const c = useColors();
    const { datos: instituciones } = useLista('/instituciones', { activos: true });
    const { datos: productos } = useLista('/productos', { activos: true });
    const { datos: modalidades } = useCatalogo('modalidades-compra', { activos: true });
    const [error, setError] = useState('');
    const [form, setForm] = useState(() => contrato ? {
        numero_contrato: contrato.numero_contrato, nog: contrato.nog, id_institucion: contrato.id_institucion,
        id_modalidad: contrato.id_modalidad, fecha_inicio: contrato.fecha_inicio, fecha_fin: contrato.fecha_fin,
        vigencia_minima_meses: contrato.vigencia_minima_meses ?? '', observaciones: contrato.observaciones || '', motivo: '',
        renglones: contrato.renglones.map(r => ({
            id_producto: r.id_producto, cantidad_contratada: Number(r.cantidad_contratada), precio_unitario: Number(r.precio_unitario),
            pedida: r.cantidad_pedida
        }))
    } : {
        numero_contrato: '', nog: '', id_institucion: '', id_modalidad: '', fecha_inicio: '', fecha_fin: '',
        vigencia_minima_meses: 12, observaciones: '', renglones: [{ ...RENGLON_VACIO }]
    });

    const campo = (k) => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });
    const cambiarRenglon = (i, k, v) => setForm({ ...form, renglones: form.renglones.map((r, j) => j === i ? { ...r, [k]: v } : r) });
    const total = form.renglones.reduce((s, r) => s + (Number(r.cantidad_contratada) || 0) * (Number(r.precio_unitario) || 0), 0);

    // Rango de monto y plazo de la modalidad elegida (Ley de Contrataciones del Estado)
    const modalidad = modalidades.find(m => String(m.id_modalidad) === String(form.id_modalidad));
    const min = modalidad?.monto_minimo != null ? Number(modalidad.monto_minimo) : null;
    const max = modalidad?.monto_maximo != null ? Number(modalidad.monto_maximo) : null;
    const fueraDeRango = modalidad && total > 0 && ((min !== null && total < min) || (max !== null && total > max));
    const rango = modalidad && (min !== null || max !== null)
        ? (min !== null && max !== null ? `de ${moneda(min)} a ${moneda(max)}` : min !== null ? `desde ${moneda(min)}` : `hasta ${moneda(max)}`)
        : null;

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const r = contrato ? await api.put(`/contratos/${contrato.id_contrato}`, form) : await api.post('/contratos', form);
            alGuardar(r.data.advertencia);
        } catch (err) { setError(mensajeError(err)); }
    };

    return (
        <Modal abierto titulo={contrato ? `Editar contrato ${contrato.numero_contrato}` : 'Nuevo contrato (GUATECOMPRAS)'} alCerrar={alCerrar} ancho="max-w-5xl"
            pie={<>
                <span className="mr-auto self-center text-sm font-medium" style={{ color: c.textPrimary }}>Monto total: {moneda(total)}</span>
                <Boton variante="secundario" onClick={alCerrar}>Cancelar</Boton>
                <Boton type="submit" form="form-contrato">Guardar</Boton>
            </>}>
            <form id="form-contrato" onSubmit={guardar}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                    <Campo etiqueta="NOG" obligatorio ayuda="Número de Operación Guatecompras"><Entrada required inputMode="numeric" {...campo('nog')} /></Campo>
                    <Campo etiqueta="No. de contrato" obligatorio><Entrada required {...campo('numero_contrato')} /></Campo>
                    <Campo etiqueta="Modalidad de compra" obligatorio className="md:col-span-2"
                        ayuda={modalidad ? [
                            rango && `Monto ${rango}.`,
                            modalidad.contrato_abierto ? 'Contrato abierto: el proveedor administra sus entregas; la institución no está obligada a comprar todo.' : 'La institución debe adquirir la cantidad adjudicada.',
                            modalidad.dias_habiles_entrega ? `Entrega de órdenes en ${modalidad.dias_habiles_entrega} días hábiles.` : null
                        ].filter(Boolean).join(' ') : undefined}>
                        <Selector vacio="Seleccionar" required {...campo('id_modalidad')} opciones={modalidades.map(m => ({ value: m.id_modalidad, label: m.nombre }))} />
                    </Campo>
                    <Campo etiqueta="Institución" obligatorio className="md:col-span-2">
                        <Selector vacio="Seleccionar" required {...campo('id_institucion')} opciones={instituciones.map(i => ({ value: i.id_institucion, label: i.nombre }))} />
                    </Campo>
                    <Campo etiqueta="Inicio" obligatorio><Entrada type="date" required {...campo('fecha_inicio')} /></Campo>
                    <Campo etiqueta="Fin" obligatorio><Entrada type="date" required min={form.fecha_inicio} {...campo('fecha_fin')} /></Campo>
                    <Campo etiqueta="Vida útil mínima exigida (meses)" ayuda="Al despachar solo se usan lotes que cumplan este mínimo. Vacío = parámetro general.">
                        <Entrada type="number" min="0" max="60" {...campo('vigencia_minima_meses')} />
                    </Campo>
                    <Campo etiqueta="Observaciones" className="md:col-span-3"><Entrada {...campo('observaciones')} /></Campo>
                </div>

                <h3 className="font-bold mb-2" style={{ color: c.textPrimary }}>Renglones adjudicados</h3>
                <div className="space-y-2">
                    {form.renglones.map((r, i) => (
                        <div key={i} className="grid grid-cols-2 md:grid-cols-12 gap-2 items-end rounded-xl p-3" style={{ backgroundColor: c.inputBg }}>
                            <Campo etiqueta={`Renglón ${i + 1}: producto`} className="col-span-2 md:col-span-6">
                                <Selector vacio="Seleccionar" required disabled={r.pedida > 0} value={r.id_producto} onChange={e => cambiarRenglon(i, 'id_producto', e.target.value)}
                                    opciones={productos.map(p => ({ value: p.id_producto, label: `${p.nombre} ${p.concentracion || ''} (${p.codigo})` }))} />
                            </Campo>
                            <Campo etiqueta="Cantidad" className="md:col-span-2" ayuda={r.pedida > 0 ? `Ya pedido: ${r.pedida}` : undefined}>
                                <Entrada type="number" min={r.pedida || 1} step="any" required value={r.cantidad_contratada} onChange={e => cambiarRenglon(i, 'cantidad_contratada', e.target.value)} />
                            </Campo>
                            <Campo etiqueta="Precio unitario (Q)" className="md:col-span-2">
                                <Entrada type="number" min="0.01" step="0.01" required value={r.precio_unitario} onChange={e => cambiarRenglon(i, 'precio_unitario', e.target.value)} />
                            </Campo>
                            <div className="md:col-span-1 text-sm text-right pb-2" style={{ color: c.textSecondary }}>{moneda((Number(r.cantidad_contratada) || 0) * (Number(r.precio_unitario) || 0))}</div>
                            <div className="md:col-span-1 flex justify-end">
                                <Boton pequeno variante="peligro" icono={Trash2} disabled={form.renglones.length === 1 || r.pedida > 0}
                                    onClick={() => setForm({ ...form, renglones: form.renglones.filter((_, j) => j !== i) })} aria-label="Quitar renglón" />
                            </div>
                        </div>
                    ))}
                </div>
                <Boton variante="secundario" icono={Plus} className="mt-3" onClick={() => setForm({ ...form, renglones: [...form.renglones, { ...RENGLON_VACIO }] })}>Agregar renglón</Boton>

                {fueraDeRango && (
                    <Aviso tono="amarillo" className="mt-4">
                        El monto total ({moneda(total)}) no corresponde a {modalidad.nombre} ({rango}). Revisa la modalidad; se puede guardar si el contrato es solo una parte del evento.
                    </Aviso>
                )}
                {contrato && (
                    <Campo etiqueta="Motivo de la modificación" obligatorio className="mt-4">
                        <AreaTexto required {...campo('motivo')} placeholder="Ej. Ampliación según adenda No. 1" />
                    </Campo>
                )}
                {error && <Aviso tono="rojo" className="mt-4">{error}</Aviso>}
            </form>
        </Modal>
    );
};

export default FormContrato;
