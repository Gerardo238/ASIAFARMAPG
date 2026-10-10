// Reglas de validación de fechas para lotes (fase 1 del plan de correcciones).
// Se usan desde loteController al crear y al editar un lote, para que ningún
// lote pueda guardarse con fechas inconsistentes, sin importar qué usuario
// lo registre ni qué pantalla use.

const MESES_VIDA_UTIL_MINIMA = 7;

const sumarMeses = (fecha, meses) => {
    const f = new Date(fecha);
    f.setMonth(f.getMonth() + meses);
    return f;
};

// esNuevo: true solo al crear un lote. La vida útil mínima se exige al
// ingresarlo; no se vuelve a exigir al editarlo, porque con el tiempo todo
// lote baja de forma natural por debajo del mínimo y eso no debe impedir
// corregir otros datos del mismo lote (por ejemplo, la cantidad).
const validarFechasLote = (fecha_fabricacion, fecha_vencimiento, { esNuevo = false } = {}) => {
    const vencimiento = new Date(fecha_vencimiento);
    if (!fecha_vencimiento || isNaN(vencimiento)) {
        return { valido: false, mensaje: 'La fecha de vencimiento no es válida.' };
    }

    if (fecha_fabricacion) {
        const fabricacion = new Date(fecha_fabricacion);
        if (isNaN(fabricacion)) {
            return { valido: false, mensaje: 'La fecha de fabricación no es válida.' };
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (fabricacion > hoy) {
            return { valido: false, mensaje: 'La fecha de fabricación no puede ser una fecha futura.' };
        }

        if (vencimiento <= fabricacion) {
            return { valido: false, mensaje: 'La fecha de vencimiento debe ser posterior a la fecha de fabricación.' };
        }
    }

    if (esNuevo) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const minimoAceptado = sumarMeses(hoy, MESES_VIDA_UTIL_MINIMA);
        if (vencimiento < minimoAceptado) {
            return {
                valido: false,
                mensaje: `El lote debe tener al menos ${MESES_VIDA_UTIL_MINIMA} meses de vigencia al momento de ingresarlo (vencer después del ${minimoAceptado.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })}).`
            };
        }
    }

    return { valido: true };
};

module.exports = { validarFechasLote, MESES_VIDA_UTIL_MINIMA };

