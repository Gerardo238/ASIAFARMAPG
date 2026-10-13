const express = require('express');
const router = express.Router();
const { login, getUsuarios, registro, updateUsuario, anularUsuario, restaurarUsuario } = require('../controllers/authController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.post('/login', login);
router.get('/usuarios', verificarToken, verificarRol('administrador', 'gerente'), getUsuarios);
router.post('/registro', verificarToken, verificarRol('administrador'), registro);
router.put('/usuarios/:id', verificarToken, verificarRol('administrador'), updateUsuario);
router.post('/usuarios/:id/anular', verificarToken, verificarRol('administrador'), anularUsuario);
router.post('/usuarios/:id/restaurar', verificarToken, verificarRol('administrador'), restaurarUsuario);

module.exports = router;
