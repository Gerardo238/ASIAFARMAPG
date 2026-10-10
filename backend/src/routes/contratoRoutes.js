const express = require('express');
const router = express.Router();
const { getContratos, getContrato, createContrato, updateContrato, deleteContrato, addDetalleContrato } = require('../controllers/contratoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, getContratos);
router.get('/:id', verificarToken, getContrato);
router.post('/', verificarToken, verificarRol('administrador', 'encargado_contratos'), createContrato);
router.put('/:id', verificarToken, verificarRol('administrador', 'encargado_contratos'), updateContrato);
router.delete('/:id', verificarToken, verificarRol('administrador'), deleteContrato);
router.post('/:id/detalle', verificarToken, verificarRol('administrador', 'encargado_contratos'), addDetalleContrato);

module.exports = router;