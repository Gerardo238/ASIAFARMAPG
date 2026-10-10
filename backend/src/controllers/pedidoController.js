const { Pedido, Contrato, Usuario, DetallePedido, Lote, Producto } = require('../models/index');

// Obtener todos los pedidos
const getPedidos = async (req, res) => {
    try {
        const pedidos = await Pedido.findAll({
            include: [
                { model: Contrato, attributes: ['numero_contrato'] },
                { model: Usuario, attributes: ['nombre', 'apellido'] },
                { model: DetallePedido, include: [{ model: Lote, attributes: ['numero_lote'] }] }
            ]
        });
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener pedidos', error: error.message });
    }
};

// Obtener pedido por ID
const getPedido = async (req, res) => {
    try {
        const pedido = await Pedido.findByPk(req.params.id, {
            include: [
                { model: Contrato, attributes: ['numero_contrato'] },
                { model: Usuario, attributes: ['nombre', 'apellido'] },
                { model: DetallePedido, include: [{ model: Lote, attributes: ['numero_lote'] }] }
            ]
        });
        if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        res.json(pedido);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener pedido', error: error.message });
    }
};

// Crear pedido
const createPedido = async (req, res) => {
    try {
        const id_usuario = req.usuario.id;
        const pedido = await Pedido.create({ ...req.body, id_usuario });
        res.status(201).json({ mensaje: 'Pedido creado exitosamente', pedido });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear pedido', error: error.message });
    }
};

// Actualizar pedido
const updatePedido = async (req, res) => {
    try {
        const pedido = await Pedido.findByPk(req.params.id);
        if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        await pedido.update(req.body);
        res.json({ mensaje: 'Pedido actualizado exitosamente', pedido });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar pedido', error: error.message });
    }
};

// Eliminar pedido permanentemente
const deletePedido = async (req, res) => {
    try {
        const pedido = await Pedido.findByPk(req.params.id);
        if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        await pedido.destroy();
        res.json({ mensaje: 'Pedido eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar pedido', error: error.message });
    }
};

// Agregar detalle al pedido
const addDetallePedido = async (req, res) => {
    try {
        const { id_lote, id_producto, cantidad, precio_unitario, descuento } = req.body;
        const lote = await Lote.findByPk(id_lote);
        if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado' });
        if (lote.cantidad_disponible < cantidad) {
            return res.status(400).json({ mensaje: 'Stock insuficiente en el lote seleccionado' });
        }
        const subtotal = cantidad * precio_unitario - (descuento || 0);
        const detalle = await DetallePedido.create({
            id_pedido: req.params.id,
            id_lote,
            id_producto,
            cantidad,
            precio_unitario,
            descuento: descuento || 0,
            subtotal
        });
        await lote.update({
            cantidad_disponible: parseFloat(lote.cantidad_disponible) - parseFloat(cantidad)
        });
        res.status(201).json({ mensaje: 'Detalle agregado exitosamente', detalle });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al agregar detalle', error: error.message });
    }
};

// Registrar entrega real
const registrarEntrega = async (req, res) => {
    try {
        const pedido = await Pedido.findByPk(req.params.id);
        if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        const fecha_real_entrega = new Date();
        const diasRetraso = Math.ceil((fecha_real_entrega - new Date(pedido.fecha_programada)) / (1000 * 60 * 60 * 24));
        await pedido.update({ fecha_real_entrega, estado: 'entregado' });
        res.json({ mensaje: 'Entrega registrada exitosamente', diasRetraso, pedido });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al registrar entrega', error: error.message });
    }
};

module.exports = { getPedidos, getPedido, createPedido, updatePedido, deletePedido, addDetallePedido, registrarEntrega };