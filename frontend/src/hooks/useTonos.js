import { useColors, MARCA } from './useColors';

// Tonos de etiquetas, avisos y filas: texto y fondo suave
export const TONOS = {
    verde: { text: '#1F8F52', bg: '#E8F6EE', fila: '#EAF6EC', fuerte: MARCA.verde },
    amarillo: { text: '#A16A00', bg: '#FFF4D6', fila: '#FFF8E4', fuerte: MARCA.amarillo },
    rojo: { text: '#D2383A', bg: '#FDECEC', fila: '#FCEDED', fuerte: MARCA.rojo },
    azul: { text: '#2F6CE0', bg: '#EAF1FE', fila: '#EEF4FE', fuerte: MARCA.azul },
    morado: { text: '#8645D6', bg: '#F3EAFD', fila: '#F5EEFD', fuerte: MARCA.morado },
    gris: { text: '#6E6E76', bg: '#F0F0F2', fila: '#F5F5F7', fuerte: '#A0A0A8' }
};
// En oscuro, las filas por estado se tiñen con color pleno (como en la referencia)
export const TONOS_OSCURO = {
    verde: { text: '#7BE0A6', bg: '#22402F', fila: '#2E6B45', fuerte: MARCA.verde },
    amarillo: { text: '#FFD976', bg: '#4A3F1E', fila: '#8A7434', fuerte: MARCA.amarillo },
    rojo: { text: '#FF9C9A', bg: '#4A2629', fila: '#8C3B3C', fuerte: MARCA.rojo },
    azul: { text: '#9CC0FF', bg: '#243555', fila: '#2F4B85', fuerte: MARCA.azul },
    morado: { text: '#CDA8FA', bg: '#372A4E', fila: '#55407A', fuerte: MARCA.morado },
    gris: { text: '#C2C2CA', bg: '#363642', fila: '#3B3B48', fuerte: '#8A8A95' }
};
export const useTonos = () => (useColors().darkMode ? TONOS_OSCURO : TONOS);
