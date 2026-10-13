// Error de regla de negocio: lleva el código HTTP y un mensaje para el usuario.
class ErrorNegocio extends Error {
    constructor(mensaje, status = 400, detalle = null) {
        super(mensaje);
        this.status = status;
        this.detalle = detalle;
    }
}

// Respuesta uniforme para cualquier error dentro de un controlador
const manejarError = (res, error, mensajePorDefecto) => {
    if (error instanceof ErrorNegocio) {
        return res.status(error.status).json({ mensaje: error.message, detalle: error.detalle });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        const campos = Object.keys(error.fields || {}).join(', ');
        return res.status(409).json({ mensaje: `Ya existe un registro con el mismo valor (${campos}).` });
    }
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ mensaje: error.errors.map(e => e.message).join(' ') });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ mensaje: 'El registro relacionado no existe o está en uso.' });
    }
    console.error(error);
    return res.status(500).json({ mensaje: mensajePorDefecto, error: error.message });
};

// Exige un texto no vacío (por ejemplo, el motivo de un cambio crítico)
const exigirTexto = (valor, mensaje) => {
    if (!valor || !String(valor).trim()) throw new ErrorNegocio(mensaje);
    return String(valor).trim();
};

const exigirCantidad = (valor, mensaje = 'La cantidad debe ser mayor que cero.') => {
    const n = Number(valor);
    if (!Number.isFinite(n) || n <= 0) throw new ErrorNegocio(mensaje);
    return n;
};

module.exports = { ErrorNegocio, manejarError, exigirTexto, exigirCantidad };
