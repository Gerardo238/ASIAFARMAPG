const { Contrato, Institucion, Usuario, DetalleContrato, Producto } = require('../models/index');

// Obtener todos los contratos
const getContratos = async (req, res) => {
    try {
        const contratos = await Contrato.findAll({
            include: [
                { model: Institucion, attributes: ['nombre', 'tipo'] },
                { model: Usuario, attributes: ['nombre', 'apellido'] },
                { model: DetalleContrato, include: [{ model: Producto, attributes: ['nombre', 'codigo'] }] }
            ]
        });
        res.json(contratos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener contratos', error: error.message });
    }
};

// Obtener contrato por ID
const getContrato = async (req, res) => {
    try {
        const contrato = await Contrato.findByPk(req.params.id, {
            include: [
                { model: Institucion, attributes: ['nombre', 'tipo'] },
                { model: Usuario, attributes: ['nombre', 'apellido'] },
                { model: DetalleContrato, include: [{ model: Producto, attributes: ['nombre', 'codigo'] }] }
            ]
        });
        if (!contrato) return res.status(404).json({ mensaje: 'Contrato no encontrado' });
        res.json(contrato);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener contrato', error: error.message });
    }
};

// Crear contrato
const createContrato = async (req, res) => {
    try {
        const id_usuario = req.usuario.id;
        const contrato = await Contrato.create({ ...req.body, id_usuario });
        res.status(201).json({ mensaje: 'Contrato creado exitosamente', contrato });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear contrato', error: error.message });
    }
};

// Actualizar contrato
const updateContrato = async (req, res) => {
    try {
        const contrato = await Contrato.findByPk(req.params.id);
        if (!contrato) return res.status(404).json({ mensaje: 'Contrato no encontrado' });
        await contrato.update(req.body);
        res.json({ mensaje: 'Contrato actualizado exitosamente', contrato });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar contrato', error: error.message });
    }
};

// Eliminar contrato permanentemente
const deleteContrato = async (req, res) => {
    try {
        const contrato = await Contrato.findByPk(req.params.id);
        if (!contrato) return res.status(404).json({ mensaje: 'Contrato no encontrado' });
        await contrato.destroy();
        res.json({ mensaje: 'Contrato eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar contrato', error: error.message });
    }
};

// Agregar detalle al contrato
const addDetalleContrato = async (req, res) => {
    try {
        const { id_producto, cantidad_comprometida, precio_unitario, descuento } = req.body;
        const subtotal = cantidad_comprometida * precio_unitario - (descuento || 0);
        const detalle = await DetalleContrato.create({
            id_contrato: req.params.id,
            id_producto,
            cantidad_comprometida,
            precio_unitario,
            descuento: descuento || 0,
            subtotal
        });
        res.status(201).json({ mensaje: 'Detalle agregado exitosamente', detalle });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al agregar detalle', error: error.message });
    }
};

module.exports = { getContratos, getContrato, createContrato, updateContrato, deleteContrato, addDetalleContrato };