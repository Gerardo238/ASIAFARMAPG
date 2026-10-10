const { Institucion } = require('../models/index');

// Obtener todas las instituciones
const getInstituciones = async (req, res) => {
    try {
        const instituciones = await Institucion.findAll();
        res.json(instituciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener instituciones', error: error.message });
    }
};

// Obtener institucion por ID
const getInstitucion = async (req, res) => {
    try {
        const institucion = await Institucion.findByPk(req.params.id);
        if (!institucion) return res.status(404).json({ mensaje: 'Institución no encontrada' });
        res.json(institucion);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener institución', error: error.message });
    }
};

// Crear institucion
const createInstitucion = async (req, res) => {
    try {
        const institucion = await Institucion.create(req.body);
        res.status(201).json({ mensaje: 'Institución creada exitosamente', institucion });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear institución', error: error.message });
    }
};

// Actualizar institucion
const updateInstitucion = async (req, res) => {
    try {
        const institucion = await Institucion.findByPk(req.params.id);
        if (!institucion) return res.status(404).json({ mensaje: 'Institución no encontrada' });
        await institucion.update(req.body);
        res.json({ mensaje: 'Institución actualizada exitosamente', institucion });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar institución', error: error.message });
    }
};

// Eliminar institucion permanentemente
const deleteInstitucion = async (req, res) => {
    try {
        const institucion = await Institucion.findByPk(req.params.id);
        if (!institucion) return res.status(404).json({ mensaje: 'Institución no encontrada' });
        await institucion.destroy();
        res.json({ mensaje: 'Institución eliminada permanentemente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar institución', error: error.message });
    }
};

module.exports = { getInstituciones, getInstitucion, createInstitucion, updateInstitucion, deleteInstitucion };