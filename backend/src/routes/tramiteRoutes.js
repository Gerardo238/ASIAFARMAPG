const express = require('express');
const router = express.Router();
const { crearTramite, resolverTramite, anularTramite, getCausas } = require('../controllers/tramiteController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

const escribir = verificarRol('administrador', 'encargado_contratos');

router.get('/causas', verificarToken, getCausas);
router.post('/', verificarToken, escribir, crearTramite);
router.post('/:id/resolver', verificarToken, escribir, resolverTramite);
router.post('/:id/anular', verificarToken, verificarRol('administrador'), anularTramite);

module.exports = router;
