const express = require('express');
const router = express.Router();
const {
    getPedidos, getPedido, createPedido, updatePedido, getPropuestaFEFO, prepararPedido, avanzarPedido, ajustarPedido, anularPedido
} = require('../controllers/pedidoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, getPedidos);
router.get('/:id', verificarToken, getPedido);
router.get('/:id/propuesta', verificarToken, getPropuestaFEFO);
router.post('/', verificarToken, verificarRol('administrador', 'encargado_contratos'), createPedido);
router.put('/:id', verificarToken, verificarRol('administrador', 'encargado_contratos'), updatePedido);
router.post('/:id/preparar', verificarToken, verificarRol('administrador', 'bodeguero'), prepararPedido);
// El encargado de contratos solo puede confirmar la entrega (se valida en el controlador)
router.post('/:id/avanzar', verificarToken, verificarRol('administrador', 'bodeguero', 'encargado_contratos'), avanzarPedido);
router.post('/:id/ajustar', verificarToken, verificarRol('administrador', 'encargado_contratos'), ajustarPedido);
router.post('/:id/anular', verificarToken, verificarRol('administrador'), anularPedido);

module.exports = router;
