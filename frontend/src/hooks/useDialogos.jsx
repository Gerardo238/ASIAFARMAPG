import { useState, useCallback } from 'react';
import { Modal, Boton, Aviso, Campo, AreaTexto } from '../components/ui';

// Diálogo que pide el motivo de una acción crítica (anular, cambiar fechas...).
// Uso: const [dialogo, pedirMotivo] = useDialogoMotivo();
//      const motivo = await pedirMotivo({ titulo, mensaje }); if (!motivo) return;
export const useDialogoMotivo = () => {
    const [estado, setEstado] = useState(null);
    const [texto, setTexto] = useState('');

    const pedirMotivo = useCallback((opciones) => new Promise((resolver) => {
        setTexto('');
        setEstado({ ...opciones, resolver });
    }), []);

    const cerrar = (valor) => { estado?.resolver(valor); setEstado(null); };

    const dialogo = (
        <Modal abierto={!!estado} titulo={estado?.titulo || 'Motivo'} alCerrar={() => cerrar(null)} ancho="max-w-lg"
            pie={<>
                <Boton variante="secundario" onClick={() => cerrar(null)}>Cancelar</Boton>
                <Boton variante={estado?.peligro ? 'peligro' : 'primario'} disabled={!texto.trim()} onClick={() => cerrar(texto.trim())}>
                    {estado?.confirmar || 'Confirmar'}
                </Boton>
            </>}>
            {estado?.mensaje && <Aviso tono={estado?.peligro ? 'amarillo' : 'azul'} className="mb-4">{estado.mensaje}</Aviso>}
            <Campo etiqueta="Motivo" ayuda="Queda registrado en la auditoría junto con tu usuario y la fecha." obligatorio>
                <AreaTexto rows={3} value={texto} autoFocus onChange={e => setTexto(e.target.value)} placeholder="Describe el motivo..." />
            </Campo>
        </Modal>
    );

    return [dialogo, pedirMotivo];
};

// Mensaje temporal de éxito/error en la parte superior de la pantalla
export const useAvisos = () => {
    const [aviso, setAviso] = useState(null);
    const mostrar = useCallback((texto, tono = 'verde') => {
        setAviso({ texto, tono });
        setTimeout(() => setAviso(null), tono === 'rojo' ? 7000 : 4000);
    }, []);
    const elemento = aviso && (
        <div className="fixed top-4 right-4 z-[60] max-w-md shadow-lg rounded-lg">
            <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>
        </div>
    );
    return [elemento, mostrar];
};
