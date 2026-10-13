import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Carga una lista de la API (catálogos, productos, instituciones, ...)
// y la deja lista para usarse en selects y tablas.
export const useLista = (ruta, { activos = false } = {}) => {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    const recargar = useCallback(async () => {
        if (!ruta) return;
        try {
            const res = await api.get(ruta, { params: activos ? { activos: 1 } : {} });
            setDatos(res.data);
        } finally {
            setCargando(false);
        }
    }, [ruta, activos]);

    useEffect(() => { recargar(); }, [recargar]);

    return { datos, cargando, recargar };
};

export const useCatalogo = (nombre, opciones) => useLista(`/catalogos/${nombre}`, opciones);
