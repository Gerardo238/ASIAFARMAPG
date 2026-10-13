const express = require('express');
const router = express.Router();
const { getLotes, getLote, getLotesAlerta, updateLote, cambiarCondicion } = require('../controllers/loteController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

// Los lotes se crean desde /api/ingresos y nunca se eliminan
router.get('/', verificarToken, getLotes);
router.get('/alertas', verificarToken, getLotesAlerta);
router.get('/:id', verificarToken, getLote);
router.put('/:id', verificarToken, verificarRol('administrador', 'bodeguero'), updateLote);
router.post('/:id/condicion', verificarToken, verificarRol('administrador', 'bodeguero'), cambiarCondicion);

module.exports = router;
