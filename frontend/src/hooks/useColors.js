import { useTheme } from '../context/ThemeContext';

export const useColors = () => {
    const { darkMode } = useTheme();

    return {
        darkMode,
        bg: darkMode ? '#0F172A' : '#F0F4F8',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        cardBorder: darkMode ? '#334155' : '#F1F5F9',
        textPrimary: darkMode ? '#F1F5F9' : '#1F2937',
        textSecondary: darkMode ? '#94A3B8' : '#6B7280',
        tableHeader: darkMode ? '#1F2D6E' : '#1F2D6E',
        tableHeaderText: '#FFFFFF',
        tableRow: darkMode ? '#1E293B' : '#FFFFFF',
        tableRowHover: darkMode ? '#263548' : '#F9FAFB',
        tableBorder: darkMode ? '#334155' : '#F3F4F6',
        inputBg: darkMode ? '#0F172A' : '#F3F4F6',
        inputText: darkMode ? '#CBD5E1' : '#4B5563',
        inputBorder: darkMode ? '#334155' : '#E5E7EB',
        btnPrimary: '#1F2D6E',
        btnPrimaryHover: '#2B8EA6',
    };
};