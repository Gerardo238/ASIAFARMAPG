const express = require('express');
const router = express.Router();
const { getContratos, getContrato, createContrato, updateContrato, cambiarEstadoContrato } = require('../controllers/contratoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

const escribir = verificarRol('administrador', 'encargado_contratos');

router.get('/', verificarToken, getContratos);
router.get('/:id', verificarToken, getContrato);
router.post('/', verificarToken, escribir, createContrato);
router.put('/:id', verificarToken, escribir, updateContrato);
router.post('/:id/estado', verificarToken, verificarRol('administrador'), cambiarEstadoContrato);

module.exports = router;
