const express = require('express');
const router = express.Router();
const { getMovimientos, getMovimientosPorLote, createAjuste } = require('../controllers/movimientoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, getMovimientos);
router.get('/lote/:id_lote', verificarToken, getMovimientosPorLote);
router.post('/ajuste', verificarToken, verificarRol('administrador', 'bodeguero'), createAjuste);

module.exports = router;
