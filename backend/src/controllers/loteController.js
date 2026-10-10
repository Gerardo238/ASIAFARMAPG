const { Lote, Producto } = require('../models/index');
const { Op } = require('sequelize');
const { validarFechasLote } = require('../utils/validacionesLote');

// Obtener todos los lotes
const getLotes = async (req, res) => {
    try {
        const lotes = await Lote.findAll({
            include: [{ model: Producto, attributes: ['nombre', 'codigo'] }]
        });
        res.json(lotes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener lotes', error: error.message });
    }
};

// Obtener lote por ID
const getLote = async (req, res) => {
    try {
        const lote = await Lote.findByPk(req.params.id, {
            include: [{ model: Producto, attributes: ['nombre', 'codigo'] }]
        });
        if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado' });
        res.json(lote);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener lote', error: error.message });
    }
};

// Crear lote
const createLote = async (req, res) => {
    try {
        const { fecha_fabricacion, fecha_vencimiento } = req.body;

        const validacion = validarFechasLote(fecha_fabricacion, fecha_vencimiento, { esNuevo: true });
        if (!validacion.valido) {
            return res.status(400).json({ mensaje: validacion.mensaje });
        }

        const lote = await Lote.create({
            ...req.body,
            ubicacion: req.body.ubicacion || 'en_bodega'
        });
        res.status(201).json({ mensaje: 'Lote creado exitosamente', lote });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear lote', error: error.message });
    }
};

// Actualizar lote
const updateLote = async (req, res) => {
    try {
        const lote = await Lote.findByPk(req.params.id);
        if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado' });

        const fecha_fabricacion = req.body.fecha_fabricacion ?? lote.fecha_fabricacion;
        const fecha_vencimiento = req.body.fecha_vencimiento ?? lote.fecha_vencimiento;

        const validacion = validarFechasLote(fecha_fabricacion, fecha_vencimiento, { esNuevo: false });
        if (!validacion.valido) {
            return res.status(400).json({ mensaje: validacion.mensaje });
        }

        await lote.update(req.body);
        res.json({ mensaje: 'Lote actualizado exitosamente', lote });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar lote', error: error.message });
    }
};

// Eliminar lote permanentemente
// NOTA (fase 2 del plan de correcciones): esto se reemplazará por una
// eliminación lógica (cambio de estado) con registro en la bitácora de
// auditoría, para poder saber quién eliminó un lote y poder restaurarlo.
const deleteLote = async (req, res) => {
    try {
        const lote = await Lote.findByPk(req.params.id);
        if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado' });
        await lote.destroy();
        res.json({ mensaje: 'Lote eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar lote', error: error.message });
    }
};

// Lotes próximos a vencer (semáforo)
const getLotesAlerta = async (req, res) => {
    try {
        const hoy = new Date();
        const en90dias = new Date();
        en90dias.setDate(hoy.getDate() + 90);
        const lotes = await Lote.findAll({
            where: {
                fecha_vencimiento: { [Op.lte]: en90dias },
                estado: { [Op.ne]: 'vencido' }
            },
            include: [{ model: Producto, attributes: ['nombre', 'codigo'] }]
        });
        const lotesConSemaforo = lotes.map(lote => {
            const diasRestantes = Math.ceil((new Date(lote.fecha_vencimiento) - hoy) / (1000 * 60 * 60 * 24));
            let semaforo = 'verde';
            if (diasRestantes <= 30) semaforo = 'rojo';
            else if (diasRestantes <= 90) semaforo = 'amarillo';
            return { ...lote.toJSON(), diasRestantes, semaforo };
        });
        res.json(lotesConSemaforo);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener alertas', error: error.message });
    }
};

module.exports = { getLotes, getLote, createLote, updateLote, getLotesAlerta, deleteLote };

