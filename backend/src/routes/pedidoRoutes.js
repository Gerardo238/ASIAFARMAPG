const express = require('express');
const router = express.Router();
const {
    getPedidos, getPedido, getDisponibilidad, createPedido, updatePedido, getPropuestaFEFO, prepararPedido, avanzarPedido,
    ajustarPedido, anularPedido, registrarCompromiso, registrarDevolucion, anularDevolucion
} = require('../controllers/pedidoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, getPedidos);
router.get('/disponibilidad', verificarToken, getDisponibilidad);
router.get('/:id', verificarToken, getPedido);
router.get('/:id/propuesta', verificarToken, getPropuestaFEFO);
router.post('/', verificarToken, verificarRol('administrador', 'encargado_contratos'), createPedido);
router.put('/:id', verificarToken, verificarRol('administrador', 'encargado_contratos'), updatePedido);
router.post('/:id/preparar', verificarToken, verificarRol('administrador', 'bodeguero'), prepararPedido);
// El encargado de contratos solo puede confirmar la entrega (se valida en el controlador)
router.post('/:id/avanzar', verificarToken, verificarRol('administrador', 'bodeguero', 'encargado_contratos'), avanzarPedido);
router.post('/:id/ajustar', verificarToken, verificarRol('administrador', 'encargado_contratos'), ajustarPedido);
router.post('/:id/anular', verificarToken, verificarRol('administrador'), anularPedido);
router.post('/:id/compromiso', verificarToken, verificarRol('administrador', 'encargado_contratos'), registrarCompromiso);
// Bodega recibe el producto devuelto; el encargado de contratos lo gestiona con la institución
router.post('/:id/devolucion', verificarToken, verificarRol('administrador', 'bodeguero', 'encargado_contratos'), registrarDevolucion);
router.post('/devoluciones/:id/anular', verificarToken, verificarRol('administrador'), anularDevolucion);

module.exports = router;
