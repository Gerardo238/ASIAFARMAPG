const express = require('express');
const router = express.Router();
const { getInstituciones, getInstitucion, createInstitucion, updateInstitucion, deleteInstitucion } = require('../controllers/institucionController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/', verificarToken, getInstituciones);
router.get('/:id', verificarToken, getInstitucion);
router.post('/', verificarToken, verificarRol('administrador', 'encargado_contratos'), createInstitucion);
router.put('/:id', verificarToken, verificarRol('administrador', 'encargado_contratos'), updateInstitucion);
router.delete('/:id', verificarToken, verificarRol('administrador'), deleteInstitucion);

module.exports = router;