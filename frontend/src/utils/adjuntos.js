import api from '../services/api';

export const TIPOS_DOCUMENTO = [
    'Factura', 'Certificado de análisis', 'Registro sanitario', 'Ficha técnica', 'Acta o constancia',
    'Contrato', 'Solicitud de prórroga', 'Resolución', 'Oficio', 'Nota técnica', 'Carta de compromiso', 'Acta de devolución', 'Otro'
];
export const ACEPTA = 'image/jpeg,image/png,image/webp,application/pdf';
const MAXIMO = 10 * 1024 * 1024;

// Lee el archivo como base64 (sin el prefijo data:...)
const leerBase64 = (archivo) => new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result).split(',')[1]);
    lector.onerror = () => rechazar(new Error('No se pudo leer el archivo.'));
    lector.readAsDataURL(archivo);
});

// Sube un archivo como adjunto de un ingreso, lote o producto
export const subirAdjunto = async (entidad, id_registro, archivo, descripcion) => {
    if (archivo.size > MAXIMO) throw new Error('El archivo pesa más de 10 MB.');
    const datos = await leerBase64(archivo);
    return api.post('/adjuntos', { entidad, id_registro, nombre_archivo: archivo.name, tipo_mime: archivo.type, datos, descripcion });
};

// Descarga el archivo con la sesión del usuario y devuelve una URL local para verlo
export const urlAdjunto = async (id_adjunto) => {
    const res = await api.get(`/adjuntos/${id_adjunto}/archivo`, { responseType: 'blob' });
    return URL.createObjectURL(res.data);
};

export const tamanoLegible = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
