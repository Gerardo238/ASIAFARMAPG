import { Insignia } from './ui';
import { CONDICIONES_LOTE, ESTADOS_PEDIDO, ESTADOS_CONTRATO, ESTADOS_INGRESO, SEMAFORO } from '../utils/catalogos';

const InsigniaDe = ({ mapa, valor }) => {
    const item = mapa[valor];
    return <Insignia tono={item?.tono || 'gris'}>{item?.label || valor || '—'}</Insignia>;
};

export const InsigniaCondicion = ({ valor }) => <InsigniaDe mapa={CONDICIONES_LOTE} valor={valor} />;
export const InsigniaPedido = ({ valor }) => <InsigniaDe mapa={ESTADOS_PEDIDO} valor={valor} />;
export const InsigniaContrato = ({ valor }) => <InsigniaDe mapa={ESTADOS_CONTRATO} valor={valor} />;
export const InsigniaIngreso = ({ valor }) => <InsigniaDe mapa={ESTADOS_INGRESO} valor={valor} />;

// semaforo: { color, dias } calculado por el backend
export const InsigniaSemaforo = ({ semaforo }) => {
    if (!semaforo) return <Insignia>—</Insignia>;
    const s = SEMAFORO[semaforo.color];
    const texto = semaforo.dias < 0 ? `Vencido hace ${-semaforo.dias} d` : `${s.label} · ${semaforo.dias} d`;
    return <Insignia tono={s.tono}>{texto}</Insignia>;
};

export const InsigniaActivo = ({ activo }) =>
    <Insignia tono={activo ? 'verde' : 'gris'}>{activo ? 'Activo' : 'Anulado'}</Insignia>;
