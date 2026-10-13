const express = require('express');
const router = express.Router();
const { buscar, detalleLote } = require('../controllers/trazabilidadController');
const { getAuditoria } = require('../controllers/auditoriaController');
const { getCatalogo, generarInforme } = require('../controllers/informeController');
const { getPanel } = require('../controllers/panelController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.get('/panel', verificarToken, getPanel);
router.get('/trazabilidad/buscar', verificarToken, buscar);
router.get('/trazabilidad/lote/:id', verificarToken, detalleLote);
router.get('/auditoria', verificarToken, verificarRol('administrador', 'gerente'), getAuditoria);
router.get('/informes', verificarToken, getCatalogo);
router.get('/informes/:clave', verificarToken, generarInforme);

module.exports = router;
