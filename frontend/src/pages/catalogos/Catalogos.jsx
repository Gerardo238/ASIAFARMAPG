import { useState } from 'react';
import { ListChecks, Plus, Pencil, Ban, RotateCcw, Lock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLista } from '../../hooks/useCatalogo';
import { Pagina, Encabezado, Tabla, Boton, Modal, Campo, Entrada, Selector, Aviso, Insignia, Pestanas } from '../../components/ui';
import { useDialogoMotivo, useAvisos } from '../../hooks/useDialogos';
import { InsigniaActivo } from '../../components/insignias';
import { mensajeError } from '../../utils/formato';
import { puede } from '../../utils/permisos';

// Definición de cada catálogo: campos del formulario y columnas
const CATALOGOS = [
    {
        clave: 'proveedores', titulo: 'Proveedores', id: 'id_proveedor', permiso: 'proveedores.escribir',
        campos: [
            { clave: 'nombre', titulo: 'Nombre / razón social', obligatorio: true }, { clave: 'nit', titulo: 'NIT', obligatorio: true },
            { clave: 'contacto', titulo: 'Contacto' }, { clave: 'telefono', titulo: 'Teléfono' },
            { clave: 'email', titulo: 'Correo' }, { clave: 'direccion', titulo: 'Dirección' }
        ]
    },
    {
        clave: 'laboratorios', titulo: 'Laboratorios', id: 'id_laboratorio', permiso: 'proveedores.escribir',
        ayuda: 'Casas farmacéuticas que fabrican el medicamento (Bayer, MK, ...). Cada lote indica su laboratorio.',
        campos: [{ clave: 'nombre', titulo: 'Nombre', obligatorio: true }, { clave: 'pais', titulo: 'País' }]
    },
    { clave: 'ubicaciones', titulo: 'Ubicaciones', id: 'id_ubicacion', permiso: 'catalogos.escribir', campos: [{ clave: 'nombre', titulo: 'Nombre', obligatorio: true }, { clave: 'descripcion', titulo: 'Descripción' }] },
    { clave: 'formas-farmaceuticas', titulo: 'Formas farmacéuticas', id: 'id_forma_farmaceutica', permiso: 'catalogos.escribir', campos: [{ clave: 'nombre', titulo: 'Nombre', obligatorio: true }, { clave: 'descripcion', titulo: 'Descripción' }] },
    { clave: 'unidades-medida', titulo: 'Unidades de medida', id: 'id_unidad_medida', permiso: 'catalogos.escribir', campos: [{ clave: 'nombre', titulo: 'Nombre', obligatorio: true }, { clave: 'descripcion', titulo: 'Descripción' }] },
    { clave: 'tipos-institucion', titulo: 'Tipos de institución', id: 'id_tipo_institucion', permiso: 'catalogos.escribir', campos: [{ clave: 'nombre', titulo: 'Nombre', obligatorio: true }, { clave: 'descripcion', titulo: 'Descripción' }] },
    { clave: 'modalidades-compra', titulo: 'Modalidades de compra', id: 'id_modalidad', permiso: 'catalogos.escribir', campos: [{ clave: 'nombre', titulo: 'Nombre', obligatorio: true }, { clave: 'descripcion', titulo: 'Descripción' }] },
    {
        clave: 'motivos-movimiento', titulo: 'Motivos de movimiento', id: 'id_motivo', permiso: 'catalogos.escribir',
        ayuda: 'Los motivos marcados como "Sistema" (compra, despacho, anulaciones) los usa el sistema y no se modifican.',
        campos: [{ clave: 'nombre', titulo: 'Nombre', obligatorio: true }, { clave: 'tipo', titulo: 'Tipo', obligatorio: true, opciones: [{ value: 'entrada', label: 'Entrada' }, { value: 'salida', label: 'Salida' }] }]
    }
];

const Catalogo = ({ def }) => {
    const { usuario } = useAuth();
    const { datos, recargar, cargando } = useLista(`/catalogos/${def.clave}`);
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');
    const [dialogo, pedirMotivo] = useDialogoMotivo();
    const [aviso, mostrar] = useAvisos();
    const puedeEscribir = puede(usuario, def.permiso);
    const puedeAnular = puede(usuario, 'catalogos.anular');

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        const { _id, ...datosForm } = form;
        try {
            if (_id) await api.put(`/catalogos/${def.clave}/${_id}`, datosForm);
            else await api.post(`/catalogos/${def.clave}`, datosForm);
            setForm(null); mostrar('Guardado'); recargar();
        } catch (err) { setError(mensajeError(err)); }
    };

    const anular = async (r) => {
        const motivo = await pedirMotivo({ titulo: `Anular "${r.nombre}"`, peligro: true, confirmar: 'Anular', mensaje: 'Dejará de aparecer en las listas, pero los registros que ya lo usan no cambian. Puede restaurarse.' });
        if (!motivo) return;
        try { await api.post(`/catalogos/${def.clave}/${r[def.id]}/anular`, { motivo }); mostrar('Anulado'); recargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const restaurar = async (r) => {
        try { await api.post(`/catalogos/${def.clave}/${r[def.id]}/restaurar`, {}); mostrar('Restaurado'); recargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    return (
        <>
            {aviso}{dialogo}
            <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                {def.ayuda ? <Aviso className="flex-1">{def.ayuda}</Aviso> : <span />}
                {puedeEscribir && <Boton icono={Plus} onClick={() => { setError(''); setForm(Object.fromEntries(def.campos.map(c => [c.clave, '']))); }}>Agregar</Boton>}
            </div>
            <Tabla
                claveFila={def.id}
                filas={datos}
                cargando={cargando}
                columnas={[
                    ...def.campos.map(c => ({ clave: c.clave, titulo: c.titulo, render: r => c.opciones ? c.opciones.find(o => o.value === r[c.clave])?.label : (r[c.clave] || '—') })),
                    { clave: 'activo', titulo: 'Estado', render: r => <div className="flex gap-1"><InsigniaActivo activo={r.activo} />{r.sistema && <Insignia tono="azul"><Lock size={10} className="inline" /> Sistema</Insignia>}</div> },
                    {
                        clave: 'acc', titulo: '', render: r => !r.sistema && (
                            <div className="flex gap-2">
                                {puedeEscribir && r.activo && <Boton pequeno variante="info" icono={Pencil} onClick={() => { setError(''); setForm({ _id: r[def.id], ...Object.fromEntries(def.campos.map(c => [c.clave, r[c.clave] ?? ''])) }); }}>Editar</Boton>}
                                {puedeAnular && (r.activo
                                    ? <Boton pequeno variante="peligro" icono={Ban} onClick={() => anular(r)}>Anular</Boton>
                                    : <Boton pequeno variante="exito" icono={RotateCcw} onClick={() => restaurar(r)}>Restaurar</Boton>)}
                            </div>
                        )
                    }
                ]}
            />
            <Modal abierto={!!form} titulo={form?._id ? `Editar ${def.titulo.toLowerCase()}` : `Agregar a ${def.titulo.toLowerCase()}`} alCerrar={() => setForm(null)} ancho="max-w-lg"
                pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton type="submit" form="form-catalogo">Guardar</Boton></>}>
                {form && (
                    <form id="form-catalogo" onSubmit={guardar} className="space-y-4">
                        {def.campos.map(c => (
                            <Campo key={c.clave} etiqueta={c.titulo} obligatorio={c.obligatorio}>
                                {c.opciones
                                    ? <Selector vacio="Seleccionar" required={c.obligatorio} value={form[c.clave]} onChange={e => setForm({ ...form, [c.clave]: e.target.value })} opciones={c.opciones} />
                                    : <Entrada required={c.obligatorio} value={form[c.clave]} onChange={e => setForm({ ...form, [c.clave]: e.target.value })} />}
                            </Campo>
                        ))}
                        {error && <Aviso tono="rojo">{error}</Aviso>}
                    </form>
                )}
            </Modal>
        </>
    );
};

const DESCRIPCION_PARAM = {
    VIGENCIA_MINIMA_INGRESO_MESES: 'Vida útil mínima al ingresar (meses)',
    VIGENCIA_MINIMA_DESPACHO_MESES: 'Vida útil mínima al despachar, por defecto (meses)',
    DIAS_SEMAFORO_ROJO: 'Semáforo rojo: días antes del vencimiento',
    DIAS_SEMAFORO_AMARILLO: 'Semáforo amarillo: días antes del vencimiento',
    DIAS_ALERTA_CONTRATO: 'Alerta de contrato por vencer (días)'
};

const Parametros = () => {
    const { usuario } = useAuth();
    const { datos, recargar } = useLista('/catalogos/parametros');
    const [edicion, setEdicion] = useState(null);
    const [error, setError] = useState('');
    const [aviso, mostrar] = useAvisos();

    const guardar = async (e) => {
        e.preventDefault();
        setError('');
        try { await api.put(`/catalogos/parametros/${edicion.clave}`, edicion); setEdicion(null); mostrar('Parámetro actualizado'); recargar(); }
        catch (err) { setError(mensajeError(err)); }
    };

    return (
        <>
            {aviso}
            <Tabla
                claveFila="clave"
                filas={datos}
                columnas={[
                    { clave: 'clave', titulo: 'Parámetro', render: p => <div><div className="font-medium">{DESCRIPCION_PARAM[p.clave] || p.clave}</div><div className="text-xs opacity-70">{p.descripcion}</div></div> },
                    { clave: 'valor', titulo: 'Valor', alinear: 'right', render: p => <b>{p.valor}</b> },
                    { clave: 'acc', titulo: '', render: p => puede(usuario, 'catalogos.escribir') && <Boton pequeno variante="info" icono={Pencil} onClick={() => { setError(''); setEdicion({ clave: p.clave, valor: p.valor, motivo: '' }); }}>Cambiar</Boton> }
                ]}
            />
            <Modal abierto={!!edicion} titulo={DESCRIPCION_PARAM[edicion?.clave] || ''} alCerrar={() => setEdicion(null)} ancho="max-w-lg"
                pie={<><Boton variante="secundario" onClick={() => setEdicion(null)}>Cancelar</Boton><Boton type="submit" form="form-param">Guardar</Boton></>}>
                {edicion && (
                    <form id="form-param" onSubmit={guardar} className="space-y-4">
                        <Campo etiqueta="Valor" obligatorio><Entrada type="number" min="0" required value={edicion.valor} onChange={e => setEdicion({ ...edicion, valor: e.target.value })} /></Campo>
                        <Campo etiqueta="Motivo del cambio" obligatorio><Entrada required value={edicion.motivo} onChange={e => setEdicion({ ...edicion, motivo: e.target.value })} /></Campo>
                        {error && <Aviso tono="rojo">{error}</Aviso>}
                    </form>
                )}
            </Modal>
        </>
    );
};

const Catalogos = () => {
    const { usuario } = useAuth();
    const visibles = CATALOGOS.filter(d => usuario?.rol === 'administrador' || puede(usuario, d.permiso));
    const pestanas = [...visibles.map(d => ({ clave: d.clave, titulo: d.titulo })), ...(usuario?.rol === 'administrador' ? [{ clave: 'parametros', titulo: 'Parámetros' }] : [])];
    const [activa, setActiva] = useState(pestanas[0]?.clave);
    const def = CATALOGOS.find(d => d.clave === activa);

    return (
        <Pagina>
            <Encabezado icono={ListChecks} titulo="Catálogos" subtitulo="Valores que se eligen de una lista en todo el sistema (nunca se escriben a mano) y parámetros de operación." />
            <Pestanas pestanas={pestanas} activa={activa} alCambiar={setActiva} />
            {activa === 'parametros' ? <Parametros /> : def && <Catalogo key={def.clave} def={def} />}
        </Pagina>
    );
};

export default Catalogos;
