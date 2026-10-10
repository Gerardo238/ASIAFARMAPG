const express = require('express');
const router = express.Router();
const { getPedidos, getPedido, createPedido, updatePedido, deletePedido, addDetallePedido, registrarEntrega } = require('../controllers/pedidoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, getPedidos);
router.get('/:id', verificarToken, getPedido);
router.post('/', verificarToken, verificarRol('administrador', 'encargado_contratos'), createPedido);
router.put('/:id', verificarToken, verificarRol('administrador', 'bodeguero', 'encargado_contratos'), updatePedido);
router.delete('/:id', verificarToken, verificarRol('administrador'), deletePedido);
router.post('/:id/detalle', verificarToken, verificarRol('administrador', 'bodeguero'), addDetallePedido);
router.put('/:id/entrega', verificarToken, verificarRol('administrador', 'bodeguero'), registrarEntrega);

module.exports = router;