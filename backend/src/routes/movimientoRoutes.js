const express = require('express');
const router = express.Router();
const { getMovimientos, getMovimientosPorLote, createMovimiento } = require('../controllers/movimientoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, getMovimientos);
router.get('/lote/:id_lote', verificarToken, getMovimientosPorLote);
router.post('/', verificarToken, verificarRol('administrador', 'bodeguero'), createMovimiento);

module.exports = router;