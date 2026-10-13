import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Pencil, Ban, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLista, useCatalogo } from '../../hooks/useCatalogo';
import { Pagina, Encabezado, Tabla, Boton, Modal, Campo, Entrada, Selector, Aviso } from '../../components/ui';
import { useDialogoMotivo, useAvisos } from '../../hooks/useDialogos';
import { InsigniaActivo } from '../../components/insignias';
import { DEPARTAMENTOS_GT } from '../../utils/catalogos';
import { mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';

const VACIO = { nombre: '', id_tipo_institucion: '', nit: '', unidad_ejecutora: '', departamento: '', direccion: '', telefono: '', email: '', contacto: '' };

const Instituciones = () => {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const { datos: instituciones, recargar, cargando } = useLista('/instituciones');
    const { datos: tipos } = useCatalogo('tipos-institucion', { activos: true });
    const [form, setForm] = useState(null);
    const [editando, setEditando] = useState(null);
    const [error, setError] = useState('');
    const [dialogo, pedirMotivo] = useDialogoMotivo();
    const [aviso, mostrar] = useAvisos();

    const abrir = (i = null) => {
        setError('');
        setEditando(i?.id_institucion || null);
        setForm(i ? Object.fromEntries(Object.keys(VACIO).map(k => [k, i[k] ?? ''])) : VACIO);
    };

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editando) await api.put(`/instituciones/${editando}`, form);
            else await api.post('/instituciones', form);
            setForm(null); mostrar('Institución guardada'); recargar();
        } catch (err) { setError(mensajeError(err)); }
    };

    const anular = async (i) => {
        const motivo = await pedirMotivo({ titulo: `Anular ${i.nombre}`, peligro: true, confirmar: 'Anular', mensaje: 'No se borra: conserva sus contratos y entregas. Puede restaurarse después.' });
        if (!motivo) return;
        try { await api.post(`/instituciones/${i.id_institucion}/anular`, { motivo }); mostrar('Institución anulada'); recargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const restaurar = async (i) => {
        try { await api.post(`/instituciones/${i.id_institucion}/restaurar`, {}); mostrar('Institución restaurada'); recargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const campo = (k) => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

    return (
        <Pagina>
            {aviso}{dialogo}
            <Encabezado icono={Building2} titulo="Instituciones" color="#C4467A"
                subtitulo="Entidades del Estado a las que se vende por GUATECOMPRAS. Haz clic en una para ver sus contratos y todo lo que se le ha entregado.">
                {puede(usuario, 'instituciones.escribir') && <Boton icono={Plus} onClick={() => abrir()}>Nueva institución</Boton>}
            </Encabezado>

            <Tabla
                claveFila="id_institucion"
                filas={instituciones}
                cargando={cargando}
                alHacerClic={i => navigate(`/instituciones/${i.id_institucion}`)}
                vacio="No hay instituciones registradas."
                columnas={[
                    { clave: 'nombre', titulo: 'Institución', render: i => <span className="font-medium">{i.nombre}</span> },
                    { clave: 'tipo', titulo: 'Tipo', render: i => i.TipoInstitucion?.nombre },
                    { clave: 'nit', titulo: 'NIT' },
                    { clave: 'unidad_ejecutora', titulo: 'Unidad ejecutora' },
                    { clave: 'departamento', titulo: 'Departamento' },
                    { clave: 'contacto', titulo: 'Contacto', render: i => <div><div>{i.contacto || '—'}</div><div className="text-xs opacity-70">{i.telefono} {i.email}</div></div> },
                    { clave: 'activo', titulo: 'Estado', render: i => <InsigniaActivo activo={i.activo} /> },
                    {
                        clave: 'acc', titulo: '', render: i => (
                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                {puede(usuario, 'instituciones.escribir') && i.activo && <Boton pequeno variante="info" icono={Pencil} onClick={() => abrir(i)}>Editar</Boton>}
                                {puede(usuario, 'instituciones.anular') && (i.activo
                                    ? <Boton pequeno variante="peligro" icono={Ban} onClick={() => anular(i)}>Anular</Boton>
                                    : <Boton pequeno variante="exito" icono={RotateCcw} onClick={() => restaurar(i)}>Restaurar</Boton>)}
                            </div>
                        )
                    }
                ]}
            />

            <Modal abierto={!!form} titulo={editando ? 'Editar institución' : 'Nueva institución'} alCerrar={() => setForm(null)}
                pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton type="submit" form="form-inst">Guardar</Boton></>}>
                {form && (
                    <form id="form-inst" onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Campo etiqueta="Nombre" obligatorio className="md:col-span-2"><Entrada required {...campo('nombre')} /></Campo>
                        <Campo etiqueta="Tipo" obligatorio>
                            <Selector vacio="Seleccionar" required {...campo('id_tipo_institucion')} opciones={tipos.map(t => ({ value: t.id_tipo_institucion, label: t.nombre }))} />
                        </Campo>
                        <Campo etiqueta="NIT"><Entrada {...campo('nit')} /></Campo>
                        <Campo etiqueta="Unidad ejecutora"><Entrada {...campo('unidad_ejecutora')} /></Campo>
                        <Campo etiqueta="Departamento">
                            <Selector vacio="Seleccionar" {...campo('departamento')} opciones={DEPARTAMENTOS_GT.map(d => ({ value: d, label: d }))} />
                        </Campo>
                        <Campo etiqueta="Dirección" className="md:col-span-2"><Entrada {...campo('direccion')} /></Campo>
                        <Campo etiqueta="Persona de contacto"><Entrada {...campo('contacto')} /></Campo>
                        <Campo etiqueta="Teléfono"><Entrada {...campo('telefono')} /></Campo>
                        <Campo etiqueta="Correo" className="md:col-span-2"><Entrada type="email" {...campo('email')} /></Campo>
                        {error && <Aviso tono="rojo" className="md:col-span-2">{error}</Aviso>}
                    </form>
                )}
            </Modal>
        </Pagina>
    );
};

export default Instituciones;
