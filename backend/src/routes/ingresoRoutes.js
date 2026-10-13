const express = require('express');
const router = express.Router();
const { getIngresos, getIngreso, createIngreso, anularIngreso, restaurarIngreso } = require('../controllers/ingresoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, getIngresos);
router.get('/:id', verificarToken, getIngreso);
router.post('/', verificarToken, verificarRol('administrador', 'bodeguero'), createIngreso);
router.post('/:id/anular', verificarToken, verificarRol('administrador'), anularIngreso);
router.post('/:id/restaurar', verificarToken, verificarRol('administrador'), restaurarIngreso);

module.exports = router;
