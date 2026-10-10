const { Producto } = require('../models/index');

// Obtener todos los productos
const getProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
    }
};

// Obtener un producto por ID
const getProducto = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener producto', error: error.message });
    }
};

// Crear producto
const createProducto = async (req, res) => {
    try {
        const producto = await Producto.create(req.body);
        res.status(201).json({ mensaje: 'Producto creado exitosamente', producto });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear producto', error: error.message });
    }
};

// Actualizar producto
const updateProducto = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });
        await producto.update(req.body);
        res.json({ mensaje: 'Producto actualizado exitosamente', producto });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar producto', error: error.message });
    }
};

// Eliminar producto permanentemente
const deleteProducto = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });
        await producto.destroy();
        res.json({ mensaje: 'Producto eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar producto', error: error.message });
    }
};

module.exports = { getProductos, getProducto, createProducto, updateProducto, deleteProducto };