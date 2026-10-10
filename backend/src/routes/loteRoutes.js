const express = require('express');
const router = express.Router();
const { getLotes, getLote, createLote, updateLote, getLotesAlerta, deleteLote } = require('../controllers/loteController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, getLotes);
router.get('/alertas', verificarToken, getLotesAlerta);
router.get('/:id', verificarToken, getLote);
router.post('/', verificarToken, verificarRol('administrador', 'bodeguero'), createLote);
router.put('/:id', verificarToken, verificarRol('administrador', 'bodeguero'), updateLote);
router.delete('/:id', verificarToken, verificarRol('administrador', 'bodeguero'), deleteLote);

module.exports = router;