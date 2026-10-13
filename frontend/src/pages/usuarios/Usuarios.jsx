import { useState } from 'react';
import { Plus, User, Pencil, UserX, UserCheck } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLista } from '../../hooks/useCatalogo';
import { Pagina, Encabezado, Tabla, Boton, Modal, Campo, Entrada, Selector, Aviso, Insignia } from '../../components/ui';
import { useDialogoMotivo, useAvisos } from '../../hooks/useDialogos';
import { ROLES } from '../../utils/catalogos';
import { mensajeError } from '../../utils/formato';

const TONO_ROL = { administrador: 'morado', gerente: 'azul', bodeguero: 'verde', encargado_contratos: 'amarillo' };
const VACIO = { nombre: '', apellido: '', email: '', password: '', rol: '' };

const Usuarios = () => {
    const { usuario: actual } = useAuth();
    const { datos: usuarios, recargar, cargando } = useLista('/auth/usuarios');
    const [form, setForm] = useState(null);
    const [editando, setEditando] = useState(null);
    const [error, setError] = useState('');
    const [dialogo, pedirMotivo] = useDialogoMotivo();
    const [aviso, mostrar] = useAvisos();

    const abrir = (u = null) => {
        setError('');
        setEditando(u?.id_usuario || null);
        setForm(u ? { nombre: u.nombre, apellido: u.apellido, email: u.email, password: '', rol: u.rol } : VACIO);
    };

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editando) await api.put(`/auth/usuarios/${editando}`, form);
            else await api.post('/auth/registro', form);
            setForm(null); mostrar('Usuario guardado'); recargar();
        } catch (err) { setError(mensajeError(err)); }
    };

    const desactivar = async (u) => {
        const motivo = await pedirMotivo({ titulo: `Desactivar a ${u.nombre} ${u.apellido}`, peligro: true, confirmar: 'Desactivar', mensaje: 'El usuario ya no podrá ingresar. No se borra, para que la auditoría siga mostrando lo que hizo.' });
        if (!motivo) return;
        try { await api.post(`/auth/usuarios/${u.id_usuario}/anular`, { motivo }); mostrar('Usuario desactivado'); recargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const reactivar = async (u) => {
        try { await api.post(`/auth/usuarios/${u.id_usuario}/restaurar`, {}); mostrar('Usuario reactivado'); recargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const campo = (k) => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

    return (
        <Pagina>
            {aviso}{dialogo}
            <Encabezado icono={User} titulo="Usuarios" subtitulo="Cada usuario tiene su propia cuenta: así la auditoría identifica quién hizo cada cambio, aunque haya varios administradores.">
                <Boton icono={Plus} onClick={() => abrir()}>Nuevo usuario</Boton>
            </Encabezado>

            <Tabla
                claveFila="id_usuario"
                filas={usuarios}
                cargando={cargando}
                columnas={[
                    { clave: 'nombre', titulo: 'Nombre', render: u => <span className="font-medium">{u.nombre} {u.apellido}</span> },
                    { clave: 'email', titulo: 'Correo' },
                    { clave: 'rol', titulo: 'Rol', render: u => <Insignia tono={TONO_ROL[u.rol]}>{ROLES[u.rol]}</Insignia> },
                    { clave: 'activo', titulo: 'Estado', render: u => <Insignia tono={u.activo ? 'verde' : 'gris'}>{u.activo ? 'Activo' : 'Inactivo'}</Insignia> },
                    {
                        clave: 'acc', titulo: '', render: u => (
                            <div className="flex gap-2">
                                <Boton pequeno variante="info" icono={Pencil} onClick={() => abrir(u)}>Editar</Boton>
                                {u.id_usuario !== actual?.id && (u.activo
                                    ? <Boton pequeno variante="peligro" icono={UserX} onClick={() => desactivar(u)}>Desactivar</Boton>
                                    : <Boton pequeno variante="exito" icono={UserCheck} onClick={() => reactivar(u)}>Reactivar</Boton>)}
                            </div>
                        )
                    }
                ]}
            />

            <Modal abierto={!!form} titulo={editando ? 'Editar usuario' : 'Nuevo usuario'} alCerrar={() => setForm(null)}
                pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton type="submit" form="form-usuario">Guardar</Boton></>}>
                {form && (
                    <form id="form-usuario" onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Campo etiqueta="Nombre" obligatorio><Entrada required {...campo('nombre')} /></Campo>
                        <Campo etiqueta="Apellido" obligatorio><Entrada required {...campo('apellido')} /></Campo>
                        <Campo etiqueta="Correo electrónico" obligatorio><Entrada type="email" required {...campo('email')} /></Campo>
                        <Campo etiqueta={editando ? 'Nueva contraseña (opcional)' : 'Contraseña'} obligatorio={!editando} ayuda="Mínimo 6 caracteres.">
                            <Entrada type="password" required={!editando} minLength={6} {...campo('password')} />
                        </Campo>
                        <Campo etiqueta="Rol" obligatorio>
                            <Selector vacio="Seleccionar rol" required {...campo('rol')} opciones={Object.entries(ROLES).map(([value, label]) => ({ value, label }))} />
                        </Campo>
                        {error && <Aviso tono="rojo" className="md:col-span-2">{error}</Aviso>}
                    </form>
                )}
            </Modal>
        </Pagina>
    );
};

export default Usuarios;
