const express = require('express');
const router = express.Router();
const { login, getUsuarios, registro, updateUsuario, deleteUsuario } = require('../controllers/authController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.post('/login', login);
router.get('/usuarios', verificarToken, verificarRol('administrador'), getUsuarios);
router.post('/registro', verificarToken, verificarRol('administrador'), registro);
router.put('/usuarios/:id', verificarToken, verificarRol('administrador'), updateUsuario);
router.delete('/usuarios/:id', verificarToken, verificarRol('administrador'), deleteUsuario);

module.exports = router;