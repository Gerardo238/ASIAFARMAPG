// Adjuntos de ingresos, lotes y productos: la foto o el PDF de la factura,
// el certificado de análisis del lote, el registro sanitario del producto...
// El archivo llega como base64 dentro del JSON (máximo 10 MB).
const { Adjunto, Ingreso, Lote, Producto, Usuario } = require('../models/index');
const { manejarError, ErrorNegocio, exigirTexto } = require('../utils/errores');
const { registrarAuditoria } = require('../utils/auditoria');

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const TAMANO_MAXIMO = 10 * 1024 * 1024;
const MODELOS = { ingresos: Ingreso, lotes: Lote, productos: Producto };

// Datos del adjunto sin el archivo (para listas)
const sinArchivo = (a) => {
    const { datos, ...resto } = a.get({ plain: true });
    return resto;
};

// GET /adjuntos?entidad=lotes&id=5
const listar = async (req, res) => {
    try {
        const { entidad, id } = req.query;
        if (!Adjunto.ENTIDADES.includes(entidad) || !id) throw new ErrorNegocio('Indica la entidad y el registro.');
        const adjuntos = await Adjunto.findAll({
            where: { entidad, id_registro: id, ...(req.query.todos ? {} : { activo: true }) },
            attributes: { exclude: ['datos'] },
            include: [{ model: Usuario, attributes: ['nombre', 'apellido'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(adjuntos);
    } catch (error) { manejarError(res, error, 'Error al obtener los adjuntos'); }
};

// GET /adjuntos/:id/archivo -> el archivo tal cual, para verlo o descargarlo
const archivo = async (req, res) => {
    try {
        const a = await Adjunto.findByPk(req.params.id);
        if (!a) return res.status(404).json({ mensaje: 'Adjunto no encontrado' });
        res.setHeader('Content-Type', a.tipo_mime);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(a.nombre_archivo)}"`);
        res.send(a.datos);
    } catch (error) { manejarError(res, error, 'Error al obtener el archivo'); }
};

// POST /adjuntos { entidad, id_registro, nombre_archivo, tipo_mime, datos (base64), descripcion }
const crear = async (req, res) => {
    try {
        const { entidad, id_registro, nombre_archivo, tipo_mime, datos, descripcion } = req.body;
        const Modelo = MODELOS[entidad];
        if (!Modelo) throw new ErrorNegocio('Solo se puede adjuntar a un ingreso, un lote o un producto.');
        if (!(await Modelo.findByPk(id_registro))) throw new ErrorNegocio('El registro no existe.', 404);
        exigirTexto(nombre_archivo, 'El archivo no tiene nombre.');
        if (!TIPOS_PERMITIDOS.includes(tipo_mime)) throw new ErrorNegocio('Solo se aceptan fotos (JPG, PNG, WEBP) o PDF.');
        const buffer = Buffer.from(String(datos || ''), 'base64');
        if (!buffer.length) throw new ErrorNegocio('El archivo está vacío.');
        if (buffer.length > TAMANO_MAXIMO) throw new ErrorNegocio('El archivo pesa más de 10 MB. Toma la foto con menor resolución o comprime el PDF.');

        const adjunto = await Adjunto.create({
            entidad, id_registro, nombre_archivo: String(nombre_archivo).slice(0, 200), tipo_mime,
            tamano: buffer.length, datos: buffer, descripcion: descripcion ? String(descripcion).slice(0, 200) : null,
            id_usuario: req.usuario.id
        });
        const plano = sinArchivo(adjunto);
        await registrarAuditoria({ req, tabla: entidad, id_registro, accion: 'adjuntar', despues: plano, motivo: `Adjuntó ${plano.nombre_archivo}` });
        res.status(201).json({ mensaje: 'Documento adjuntado', adjunto: plano });
    } catch (error) { manejarError(res, error, 'Error al adjuntar el documento'); }
};

// POST /adjuntos/:id/anular { motivo } -> deja de mostrarse, pero no se borra
const anular = async (req, res) => {
    try {
        const motivo = exigirTexto(req.body?.motivo, 'Indica el motivo.');
        const a = await Adjunto.findByPk(req.params.id, { attributes: { exclude: ['datos'] } });
        if (!a) return res.status(404).json({ mensaje: 'Adjunto no encontrado' });
        if (!a.activo) throw new ErrorNegocio('El adjunto ya está anulado.');
        const antes = sinArchivo(a);
        await a.update({ activo: false });
        await registrarAuditoria({ req, tabla: a.entidad, id_registro: a.id_registro, accion: 'anular', antes, despues: sinArchivo(a), motivo: `Adjunto ${a.nombre_archivo}: ${motivo}` });
        res.json({ mensaje: 'Adjunto anulado' });
    } catch (error) { manejarError(res, error, 'Error al anular el adjunto'); }
};

module.exports = { listar, archivo, crear, anular };
