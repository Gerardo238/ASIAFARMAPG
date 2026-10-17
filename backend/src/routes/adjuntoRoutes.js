const express = require('express');
const router = express.Router();
const { listar, archivo, crear, anular } = require('../controllers/adjuntoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, listar);
router.get('/:id/archivo', verificarToken, archivo);
// El permiso según el registro (ingreso, contrato, pedido...) se valida en el controlador
router.post('/', verificarToken, verificarRol('administrador', 'bodeguero', 'encargado_contratos'), crear);
router.post('/:id/anular', verificarToken, verificarRol('administrador'), anular);

module.exports = router;
