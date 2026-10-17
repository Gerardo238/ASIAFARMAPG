import { useState, useEffect, useCallback, useRef } from 'react';
import { Paperclip, FileText, Ban, Upload, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useColors, MARCA } from '../hooks/useColors';
import { useDialogoMotivo, useAvisos } from '../hooks/useDialogos';
import { Tarjeta, Boton, Selector, Modal } from './ui';
import { subirAdjunto, urlAdjunto, tamanoLegible, TIPOS_DOCUMENTO, ACEPTA } from '../utils/adjuntos';
import { formatFechaHora } from '../utils/fechas';
import { mensajeError } from '../utils/formato';
import { puede } from '../utils/permisos';

// Miniatura de una foto adjunta (se descarga con la sesión del usuario)
const Miniatura = ({ adjunto }) => {
    const c = useColors();
    const [url, setUrl] = useState(null);
    useEffect(() => {
        let creada;
        if (adjunto.tipo_mime.startsWith('image/')) urlAdjunto(adjunto.id_adjunto).then(u => { creada = u; setUrl(u); }).catch(() => {});
        return () => { if (creada) URL.revokeObjectURL(creada); };
    }, [adjunto]);
    return (
        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: c.suave }}>
            {url ? <img src={url} alt={adjunto.nombre_archivo} className="w-full h-full object-cover" />
                : <FileText size={30} strokeWidth={1.3} style={{ color: adjunto.tipo_mime === 'application/pdf' ? MARCA.rojo : c.textSecondary }} />}
        </div>
    );
};

// Documentos de un ingreso, lote o producto: foto o PDF de la factura, certificados...
const Adjuntos = ({ entidad, id, titulo = 'Documentos adjuntos', nota, tipoInicial = 'Factura', className = '', permiso = 'adjuntos.subir', vacio }) => {
    const c = useColors();
    const { usuario } = useAuth();
    const [lista, setLista] = useState([]);
    const [tipo, setTipo] = useState(tipoInicial);
    const [subiendo, setSubiendo] = useState(false);
    const [vista, setVista] = useState(null);
    const entrada = useRef(null);
    const [dialogo, pedirMotivo] = useDialogoMotivo();
    const [aviso, mostrar] = useAvisos();
    const puedeSubir = puede(usuario, permiso);

    const cargar = useCallback(() => {
        if (!id) return;
        api.get('/adjuntos', { params: { entidad, id } }).then(r => setLista(r.data)).catch(() => setLista([]));
    }, [entidad, id]);
    useEffect(() => { cargar(); }, [cargar]);

    const subir = async (e) => {
        const archivos = [...e.target.files];
        e.target.value = '';
        if (!archivos.length) return;
        setSubiendo(true);
        try {
            for (const a of archivos) await subirAdjunto(entidad, id, a, tipo);
            mostrar(archivos.length > 1 ? `${archivos.length} documentos adjuntados` : 'Documento adjuntado');
            cargar();
        } catch (err) { mostrar(err.response ? mensajeError(err) : err.message, 'rojo'); }
        finally { setSubiendo(false); }
    };

    const abrir = async (a) => {
        try {
            const url = await urlAdjunto(a.id_adjunto);
            if (a.tipo_mime === 'application/pdf') window.open(url, '_blank');
            else setVista({ ...a, url });
        } catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    const anular = async (a) => {
        const motivo = await pedirMotivo({ titulo: `Quitar "${a.nombre_archivo}"`, peligro: true, confirmar: 'Quitar', mensaje: 'El documento deja de mostrarse, pero queda guardado y registrado en la auditoría.' });
        if (!motivo) return;
        try { await api.post(`/adjuntos/${a.id_adjunto}/anular`, { motivo }); mostrar('Documento quitado'); cargar(); }
        catch (err) { mostrar(mensajeError(err), 'rojo'); }
    };

    return (
        <Tarjeta titulo={titulo} icono={Paperclip} nota={nota} className={className}
            acciones={puedeSubir && (
                <div className="flex items-center gap-2">
                    <div className="w-44"><Selector value={tipo} onChange={e => setTipo(e.target.value)} opciones={TIPOS_DOCUMENTO.map(t => ({ value: t, label: t }))} /></div>
                    <Boton icono={Upload} disabled={subiendo} onClick={() => entrada.current?.click()}>{subiendo ? 'Subiendo…' : 'Adjuntar'}</Boton>
                    <input ref={entrada} type="file" accept={ACEPTA} multiple hidden onChange={subir} />
                </div>
            )}>
            {aviso}{dialogo}
            {lista.length === 0 ? (
                <button type="button" disabled={!puedeSubir} onClick={() => entrada.current?.click()}
                    className="w-full rounded-xl py-8 text-center text-[13px]" style={{ border: `1.5px dashed ${c.inputBorder}`, color: c.textSecondary }}>
                    {puedeSubir ? (vacio || 'Todavía no hay documentos. Toca aquí para adjuntar una foto o el PDF de la factura.') : 'Todavía no hay documentos.'}
                </button>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {lista.map(a => (
                        <div key={a.id_adjunto} className="group">
                            <button type="button" onClick={() => abrir(a)} className="w-full text-left">
                                <Miniatura adjunto={a} />
                                <p className="text-[12.5px] font-medium mt-2 truncate" style={{ color: c.textPrimary }}>{a.descripcion || 'Documento'}</p>
                                <p className="text-[11px] truncate" style={{ color: c.textSecondary }} title={a.nombre_archivo}>{a.nombre_archivo} · {tamanoLegible(a.tamano)}</p>
                                <p className="text-[11px]" style={{ color: c.textSecondary }}>{a.Usuario?.nombre} · {formatFechaHora(a.createdAt)}</p>
                            </button>
                            {puede(usuario, 'adjuntos.anular') && (
                                <button type="button" onClick={() => anular(a)} className="mt-1 text-[11px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: MARCA.rojo }}>
                                    <Ban size={11} />Quitar
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal abierto={!!vista} titulo={vista?.descripcion || 'Documento'} alCerrar={() => { URL.revokeObjectURL(vista.url); setVista(null); }} ancho="max-w-4xl"
                pie={vista && <Boton variante="secundario" icono={ExternalLink} onClick={() => window.open(vista.url, '_blank')}>Abrir en otra pestaña</Boton>}>
                {vista && <img src={vista.url} alt={vista.nombre_archivo} className="w-full rounded-lg" />}
            </Modal>
        </Tarjeta>
    );
};

export default Adjuntos;
