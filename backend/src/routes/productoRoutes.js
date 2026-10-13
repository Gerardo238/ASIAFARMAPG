const express = require('express');
const router = express.Router();
const { getProductos, getProducto, createProducto, updateProducto, anularProducto, restaurarProducto } = require('../controllers/productoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, getProductos);
router.get('/:id', verificarToken, getProducto);
router.post('/', verificarToken, verificarRol('administrador', 'bodeguero'), createProducto);
router.put('/:id', verificarToken, verificarRol('administrador', 'bodeguero'), updateProducto);
router.post('/:id/anular', verificarToken, verificarRol('administrador'), anularProducto);
router.post('/:id/restaurar', verificarToken, verificarRol('administrador'), restaurarProducto);

module.exports = router;
