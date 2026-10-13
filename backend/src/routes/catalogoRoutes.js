const express = require('express');
const router = express.Router();
const { despachar, protegerMotivosSistema, getParametros, updateParametro } = require('../controllers/catalogoController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

// Proveedores y laboratorios los puede mantener también el bodeguero
const puedeEscribir = (req, res, next) => {
    const roles = ['proveedores', 'laboratorios'].includes(req.params.catalogo)
        ? ['administrador', 'bodeguero']
        : ['administrador'];
    return verificarRol(...roles)(req, res, next);
};

router.get('/parametros', verificarToken, getParametros);
router.put('/parametros/:clave', verificarToken, verificarRol('administrador'), updateParametro);

router.get('/:catalogo', verificarToken, despachar('listar'));
router.get('/:catalogo/:id', verificarToken, despachar('obtener'));
router.post('/:catalogo', verificarToken, puedeEscribir, despachar('crear'));
router.put('/:catalogo/:id', verificarToken, puedeEscribir, protegerMotivosSistema, despachar('actualizar'));
router.post('/:catalogo/:id/anular', verificarToken, verificarRol('administrador'), protegerMotivosSistema, despachar('anular'));
router.post('/:catalogo/:id/restaurar', verificarToken, verificarRol('administrador'), despachar('restaurar'));

module.exports = router;
