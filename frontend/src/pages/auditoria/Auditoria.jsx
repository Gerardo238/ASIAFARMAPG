import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { useColors } from '../../hooks/useColors';
import { Pagina, Encabezado, Tabla, Modal, Entrada, Selector, Insignia, DatoFicha } from '../../components/ui';
import { ACCIONES_AUDITORIA, TABLAS_AUDITORIA, ROLES } from '../../utils/catalogos';
import { formatFechaHora } from '../../utils/fechas';

const TONO_ACCION = { crear: 'verde', editar: 'azul', anular: 'rojo', restaurar: 'morado', cambio_estado: 'amarillo', ajuste_inventario: 'amarillo' };
const OCULTOS = ['createdAt', 'updatedAt'];

const mostrarValor = (v) => {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
};

// Compara antes y después campo por campo (solo campos simples)
const diferencias = (antes, despues) => {
    const claves = [...new Set([...Object.keys(antes || {}), ...Object.keys(despues || {})])]
        .filter(k => !OCULTOS.includes(k) && typeof (antes?.[k] ?? despues?.[k]) !== 'object');
    return claves.map(k => ({ campo: k, antes: antes?.[k], despues: despues?.[k], cambio: mostrarValor(antes?.[k]) !== mostrarValor(despues?.[k]) }));
};

const Auditoria = () => {
    const c = useColors();
    const [filtros, setFiltros] = useState({ tabla: '', id_usuario: '', accion: '', id_registro: '', desde: '', hasta: '' });
    const [registros, setRegistros] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [detalle, setDetalle] = useState(null);

    useEffect(() => { api.get('/auth/usuarios').then(r => setUsuarios(r.data)).catch(() => {}); }, []);

    const cargar = useCallback(async () => {
        setCargando(true);
        const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
        try { setRegistros((await api.get('/auditoria', { params })).data); } finally { setCargando(false); }
    }, [filtros]);
    useEffect(() => { const t = setTimeout(cargar, 250); return () => clearTimeout(t); }, [cargar]);

    const f = (k) => ({ value: filtros[k], onChange: e => setFiltros({ ...filtros, [k]: e.target.value }) });

    return (
        <Pagina>
            <Encabezado icono={ShieldCheck} titulo="Auditoría"
                subtitulo="Bitácora de todo lo que se crea, modifica, anula o restaura: quién lo hizo, cuándo, por qué y qué datos cambiaron." />

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                <Selector vacio="Todos los módulos" {...f('tabla')} opciones={Object.entries(TABLAS_AUDITORIA).map(([value, label]) => ({ value, label }))} />
                <Selector vacio="Todos los usuarios" {...f('id_usuario')} opciones={[{ value: 'sistema', label: 'Sistema (automático)' }, ...usuarios.map(u => ({ value: u.id_usuario, label: `${u.nombre} ${u.apellido}` }))]} />
                <Selector vacio="Todas las acciones" {...f('accion')} opciones={Object.entries(ACCIONES_AUDITORIA).map(([value, label]) => ({ value, label }))} />
                <Entrada placeholder="ID del registro" {...f('id_registro')} />
                <Entrada type="date" title="Desde" {...f('desde')} />
                <Entrada type="date" title="Hasta" {...f('hasta')} />
            </div>

            <Tabla
                claveFila="id_auditoria"
                filas={registros}
                cargando={cargando}
                alHacerClic={setDetalle}
                vacio="Sin registros de auditoría."
                columnas={[
                    { clave: 'fecha', titulo: 'Fecha', render: a => formatFechaHora(a.fecha) },
                    { clave: 'usuario', titulo: 'Usuario', render: a => a.Usuario ? <div><div>{a.Usuario.nombre} {a.Usuario.apellido}</div><div className="text-xs opacity-70">{ROLES[a.Usuario.rol]}</div></div> : <Insignia>Sistema</Insignia> },
                    { clave: 'accion', titulo: 'Acción', render: a => <Insignia tono={TONO_ACCION[a.accion] || 'gris'}>{ACCIONES_AUDITORIA[a.accion] || a.accion}</Insignia> },
                    { clave: 'tabla', titulo: 'Módulo', render: a => TABLAS_AUDITORIA[a.tabla] || a.tabla },
                    { clave: 'registro', titulo: 'Registro', render: a => `#${a.id_registro} ${a.datos_despues?.numero_lote || a.datos_despues?.numero_contrato || a.datos_despues?.numero_pedido || a.datos_despues?.nombre || a.datos_antes?.nombre || ''}` },
                    { clave: 'cambios', titulo: 'Campos cambiados', render: a => diferencias(a.datos_antes, a.datos_despues).filter(d => d.cambio && a.datos_antes).map(d => d.campo).join(', ') || '—' },
                    { clave: 'motivo', titulo: 'Motivo', render: a => a.motivo || '—' }
                ]}
            />

            <Modal abierto={!!detalle} titulo="Detalle del cambio" alCerrar={() => setDetalle(null)} ancho="max-w-4xl">
                {detalle && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <DatoFicha etiqueta="Fecha" valor={formatFechaHora(detalle.fecha)} />
                            <DatoFicha etiqueta="Usuario" valor={detalle.Usuario ? `${detalle.Usuario.nombre} ${detalle.Usuario.apellido} (${detalle.Usuario.email})` : 'Sistema'} />
                            <DatoFicha etiqueta="Acción" valor={`${ACCIONES_AUDITORIA[detalle.accion] || detalle.accion} · ${TABLAS_AUDITORIA[detalle.tabla] || detalle.tabla} #${detalle.id_registro}`} />
                            <DatoFicha etiqueta="Motivo" valor={detalle.motivo || '—'} />
                        </div>
                        <Tabla
                            filas={diferencias(detalle.datos_antes, detalle.datos_despues)}
                            columnas={[
                                { clave: 'campo', titulo: 'Campo', render: d => <span className={d.cambio ? 'font-bold' : ''}>{d.campo}</span> },
                                { clave: 'antes', titulo: 'Antes', render: d => <span style={{ color: d.cambio && detalle.datos_antes ? '#991B1B' : c.textSecondary }}>{mostrarValor(d.antes)}</span> },
                                { clave: 'despues', titulo: 'Después', render: d => <span style={{ color: d.cambio ? '#065F46' : c.textSecondary }}>{mostrarValor(d.despues)}</span> }
                            ]}
                        />
                    </>
                )}
            </Modal>
        </Pagina>
    );
};

export default Auditoria;
