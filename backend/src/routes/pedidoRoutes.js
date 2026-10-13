const express = require('express');
const router = express.Router();
const {
    getPedidos, getPedido, createPedido, updatePedido, getPropuestaFEFO, prepararPedido, avanzarPedido, anularPedido
} = require('../controllers/pedidoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, getPedidos);
router.get('/:id', verificarToken, getPedido);
router.get('/:id/propuesta', verificarToken, getPropuestaFEFO);
router.post('/', verificarToken, verificarRol('administrador', 'encargado_contratos'), createPedido);
router.put('/:id', verificarToken, verificarRol('administrador', 'encargado_contratos'), updatePedido);
router.post('/:id/preparar', verificarToken, verificarRol('administrador', 'bodeguero'), prepararPedido);
router.post('/:id/avanzar', verificarToken, verificarRol('administrador', 'bodeguero'), avanzarPedido);
router.post('/:id/anular', verificarToken, verificarRol('administrador'), anularPedido);

module.exports = router;
