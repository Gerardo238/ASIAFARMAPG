const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/institucionController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

const escribir = verificarRol('administrador', 'encargado_contratos');

router.get('/', verificarToken, ctrl.listar);
router.get('/:id', verificarToken, ctrl.obtener);
router.get('/:id/historial', verificarToken, ctrl.getHistorial);
router.post('/', verificarToken, escribir, ctrl.crear);
router.put('/:id', verificarToken, escribir, ctrl.actualizar);
router.post('/:id/anular', verificarToken, verificarRol('administrador'), ctrl.anular);
router.post('/:id/restaurar', verificarToken, verificarRol('administrador'), ctrl.restaurar);

module.exports = router;
