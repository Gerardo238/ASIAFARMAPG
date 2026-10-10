const express = require('express');
const router = express.Router();
const { getProductos, getProducto, createProducto, updateProducto, deleteProducto } = require('../controllers/productoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, getProductos);
router.get('/:id', verificarToken, getProducto);
router.post('/', verificarToken, verificarRol('administrador', 'bodeguero'), createProducto);
router.put('/:id', verificarToken, verificarRol('administrador', 'bodeguero'), updateProducto);
router.delete('/:id', verificarToken, verificarRol('administrador'), deleteProducto);

module.exports = router;