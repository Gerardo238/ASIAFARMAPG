const {
    Ubicacion, FormaFarmaceutica, UnidadMedida, TipoInstitucion, ModalidadCompra,
    MotivoMovimiento, Laboratorio, Proveedor, Parametro
} = require('../models/index');
const { crearControladorCatalogo } = require('./catalogoFactory');
const { manejarError, ErrorNegocio, exigirTexto } = require('../utils/errores');
const { registrarAuditoria, instantanea } = require('../utils/auditoria');

const simple = (modelo, tabla, etiqueta) =>
    crearControladorCatalogo({ modelo, tabla, etiqueta, campos: ['nombre', 'descripcion'] });

// Clave en la URL (/api/catalogos/:catalogo) -> controlador
const CATALOGOS = {
    ubicaciones: simple(Ubicacion, 'ubicaciones', 'ubicación'),
    'formas-farmaceuticas': simple(FormaFarmaceutica, 'formas_farmaceuticas', 'forma farmacéutica'),
    'unidades-medida': simple(UnidadMedida, 'unidades_medida', 'unidad de medida'),
    'tipos-institucion': simple(TipoInstitucion, 'tipos_institucion', 'tipo de institución'),
    'modalidades-compra': simple(ModalidadCompra, 'modalidades_compra', 'modalidad de compra'),
    'motivos-movimiento': crearControladorCatalogo({
        modelo: MotivoMovimiento, tabla: 'motivos_movimiento', etiqueta: 'motivo',
        campos: ['nombre', 'tipo'],
        validar: (d) => {
            if (!['entrada', 'salida'].includes(d.tipo)) throw new ErrorNegocio('El tipo del motivo debe ser entrada o salida.');
        }
    }),
    laboratorios: crearControladorCatalogo({
        modelo: Laboratorio, tabla: 'laboratorios', etiqueta: 'laboratorio', campos: ['nombre', 'pais']
    }),
    proveedores: crearControladorCatalogo({
        modelo: Proveedor, tabla: 'proveedores', etiqueta: 'proveedor',
        campos: ['nombre', 'nit', 'direccion', 'telefono', 'email', 'contacto'],
        validar: (d) => {
            if (!d.nombre) throw new ErrorNegocio('El nombre del proveedor es obligatorio.');
            if (!d.nit) throw new ErrorNegocio('El NIT del proveedor es obligatorio.');
        }
    })
};

// Los motivos que usa el sistema (compra, despacho...) no se pueden modificar
const protegerMotivosSistema = async (req, res, next) => {
    if (req.params.catalogo !== 'motivos-movimiento' || !req.params.id) return next();
    const motivo = await MotivoMovimiento.findByPk(req.params.id);
    if (motivo?.sistema) return res.status(400).json({ mensaje: 'Este motivo lo usa el sistema y no se puede modificar.' });
    next();
};

const despachar = (accion) => (req, res) => {
    const ctrl = CATALOGOS[req.params.catalogo];
    if (!ctrl) return res.status(404).json({ mensaje: 'Catálogo no encontrado.' });
    return ctrl[accion](req, res);
};

// ---------- Parámetros del sistema ----------
const getParametros = async (req, res) => {
    try {
        res.json(await Parametro.findAll({ order: [['clave', 'ASC']] }));
    } catch (error) { manejarError(res, error, 'Error al obtener parámetros'); }
};

const updateParametro = async (req, res) => {
    try {
        const parametro = await Parametro.findByPk(req.params.clave);
        if (!parametro) throw new ErrorNegocio('Parámetro no encontrado.', 404);
        const valor = Number(req.body.valor);
        if (!Number.isInteger(valor) || valor < 0) throw new ErrorNegocio('El valor debe ser un número entero mayor o igual a cero.');
        const motivo = exigirTexto(req.body.motivo, 'Indica el motivo del cambio del parámetro.');
        const antes = instantanea(parametro);
        await parametro.update({ valor: String(valor) });
        await registrarAuditoria({ req, tabla: 'parametros', id_registro: parametro.clave, accion: 'editar', antes, despues: parametro, motivo });
        res.json({ mensaje: 'Parámetro actualizado', parametro });
    } catch (error) { manejarError(res, error, 'Error al actualizar parámetro'); }
};

module.exports = { CATALOGOS, despachar, protegerMotivosSistema, getParametros, updateParametro };
