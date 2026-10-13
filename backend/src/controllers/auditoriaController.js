const { Op } = require('sequelize');
const { Auditoria, Usuario } = require('../models/index');
const { manejarError } = require('../utils/errores');
const { esFechaValida } = require('../utils/fechas');

// Filtros: tabla, id_registro, id_usuario, accion, desde, hasta
const getAuditoria = async (req, res) => {
    try {
        const { tabla, id_registro, id_usuario, accion, desde, hasta } = req.query;
        const where = {};
        if (tabla) where.tabla = tabla;
        if (id_registro) where.id_registro = String(id_registro);
        if (id_usuario) where.id_usuario = id_usuario === 'sistema' ? null : id_usuario;
        if (accion) where.accion = accion;
        if (esFechaValida(desde) || esFechaValida(hasta)) {
            where.fecha = {};
            if (esFechaValida(desde)) where.fecha[Op.gte] = new Date(`${desde}T00:00:00-06:00`);
            if (esFechaValida(hasta)) where.fecha[Op.lte] = new Date(`${hasta}T23:59:59-06:00`);
        }
        const registros = await Auditoria.findAll({
            where,
            include: [{ model: Usuario, attributes: ['id_usuario', 'nombre', 'apellido', 'rol', 'email'] }],
            order: [['fecha', 'DESC'], ['id_auditoria', 'DESC']],
            limit: 1000
        });
        res.json(registros);
    } catch (error) { manejarError(res, error, 'Error al obtener la auditoría'); }
};

module.exports = { getAuditoria };
