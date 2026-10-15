import { useTheme } from '../context/ThemeContext';

// Paleta de acentos (igual en claro y oscuro)
export const MARCA = {
    tinta: '#1B2A5E',
    azul: '#3D7EF6',
    amarillo: '#FFC727',
    morado: '#A35CF1',
    verde: '#2EB66A',
    rojo: '#EF5350',
    ocre: '#F2A53A',
    magenta: '#D85BB4'
};

export const useColors = () => {
    const { darkMode } = useTheme();

    return {
        darkMode,
        bg: darkMode ? '#1F1F27' : '#F5F5F5',
        card: darkMode ? '#2A2A35' : '#FFFFFF',
        cardBorder: darkMode ? '#34343F' : '#EDEDED',
        suave: darkMode ? '#33333F' : '#F5F6F8',
        riel: darkMode ? '#3A3A47' : '#EEF3FE',
        textPrimary: darkMode ? '#F2F2F5' : '#1C1C1E',
        textSecondary: darkMode ? '#9C9CA8' : '#8E8E93',
        tableHeader: 'transparent',
        tableHeaderText: darkMode ? '#9C9CA8' : '#9A9AA0',
        tableRow: darkMode ? '#2A2A35' : '#FFFFFF',
        tableRowHover: darkMode ? '#31313D' : '#F8F9FB',
        tableBorder: darkMode ? '#34343F' : '#F0F0F0',
        inputBg: darkMode ? '#24242E' : '#FFFFFF',
        inputText: darkMode ? '#F2F2F5' : '#1C1C1E',
        inputBorder: darkMode ? '#3A3A47' : '#E3E3E6',
        btnPrimary: MARCA.azul,
        btnPrimaryHover: '#2F6CE0',
        acento: MARCA.azul,
        tinta: darkMode ? '#F2F2F5' : '#1C1C1E',
        // Píldora del menú activo
        menuActivo: darkMode ? '#FFFFFF' : '#EAF1FE',
        menuActivoTexto: '#1C1C1E',
        menu: darkMode ? '#26262F' : '#FFFFFF'
    };
};
