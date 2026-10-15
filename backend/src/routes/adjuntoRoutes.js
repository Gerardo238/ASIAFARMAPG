const express = require('express');
const router = express.Router();
const { listar, archivo, crear, anular } = require('../controllers/adjuntoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, listar);
router.get('/:id/archivo', verificarToken, archivo);
router.post('/', verificarToken, verificarRol('administrador', 'bodeguero'), crear);
router.post('/:id/anular', verificarToken, verificarRol('administrador'), anular);

module.exports = router;
