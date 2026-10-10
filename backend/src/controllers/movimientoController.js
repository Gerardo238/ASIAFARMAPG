const { Movimiento, Lote, Usuario } = require('../models/index');

// Obtener todos los movimientos
const getMovimientos = async (req, res) => {
    try {
        const movimientos = await Movimiento.findAll({
            include: [
                { model: Lote, attributes: ['numero_lote'] },
                { model: Usuario, attributes: ['nombre', 'apellido'] }
            ]
        });
        res.json(movimientos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener movimientos', error: error.message });
    }
};

// Obtener movimientos por lote
const getMovimientosPorLote = async (req, res) => {
    try {
        const movimientos = await Movimiento.findAll({
            where: { id_lote: req.params.id_lote },
            include: [
                { model: Usuario, attributes: ['nombre', 'apellido'] }
            ]
        });
        res.json(movimientos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener movimientos', error: error.message });
    }
};

// Registrar movimiento
const createMovimiento = async (req, res) => {
    try {
        const { id_lote, tipo_movimiento, entrada, salida, motivo } = req.body;
        const id_usuario = req.usuario.id;

        // Obtener lote actual
        const lote = await Lote.findByPk(id_lote);
        if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado' });

        // Calcular saldo
        const saldo = parseFloat(lote.cantidad_disponible) + parseFloat(entrada || 0) - parseFloat(salida || 0);

        if (saldo < 0) {
            return res.status(400).json({ mensaje: 'Stock insuficiente para realizar la salida' });
        }

        // Crear movimiento
        const movimiento = await Movimiento.create({
            id_lote,
            id_usuario,
            tipo_movimiento,
            entrada: entrada || 0,
            salida: salida || 0,
            saldo,
            motivo,
            fecha_movimiento: new Date()
        });

        // Actualizar cantidad disponible del lote
        await lote.update({ cantidad_disponible: saldo });

        res.status(201).json({ mensaje: 'Movimiento registrado exitosamente', movimiento });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al registrar movimiento', error: error.message });
    }
};

module.exports = { getMovimientos, getMovimientosPorLote, createMovimiento };