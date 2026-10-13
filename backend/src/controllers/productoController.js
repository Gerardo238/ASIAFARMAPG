const { Op, fn, col, where: sqlWhere } = require('sequelize');
const {
    Producto, Lote, FormaFarmaceutica, UnidadMedida, Laboratorio, Ingreso, Proveedor,
    Ubicacion, Movimiento, MotivoMovimiento, Usuario, Pedido
} = require('../models/index');
const { manejarError, ErrorNegocio, exigirTexto } = require('../utils/errores');
const { registrarAuditoria, instantanea } = require('../utils/auditoria');
const { obtenerParametros } = require('../services/parametros');
const { semaforo, redondear } = require('../services/inventario');
const { hoy, sumarMeses } = require('../utils/fechas');

const CAMPOS = ['codigo', 'nombre', 'descripcion', 'id_forma_farmaceutica', 'concentracion', 'id_unidad_medida', 'stock_minimo'];
const INCLUDE_CATALOGOS = [
    { model: FormaFarmaceutica, attributes: ['nombre'] },
    { model: UnidadMedida, attributes: ['nombre'] }
];

// Existencia de un producto = suma de sus lotes disponibles (no vencidos,
// no bloqueados ni en cuarentena). Se calcula, no se guarda, para que nunca
// se desajuste con los lotes.
const resumirLotes = (lotes, parametros) => {
    const fechaMinDespacho = sumarMeses(hoy(), parametros.VIGENCIA_MINIMA_DESPACHO_MESES);
    let existencia = 0, despachable = 0, retenido = 0, proximo = null;
    lotes.forEach(l => {
        const cant = Number(l.cantidad_disponible);
        if (l.condicion === 'disponible') {
            existencia += cant;
            if (l.fecha_vencimiento >= fechaMinDespacho) despachable += cant;
            if (cant > 0 && (!proximo || l.fecha_vencimiento < proximo)) proximo = l.fecha_vencimiento;
        } else if (['cuarentena', 'bloqueado', 'vencido'].includes(l.condicion)) {
            retenido += cant;
        }
    });
    return {
        existencia: redondear(existencia),
        existencia_despachable: redondear(despachable),
        existencia_retenida: redondear(retenido),
        lotes_con_existencia: lotes.filter(l => Number(l.cantidad_disponible) > 0 && l.condicion === 'disponible').length,
        proximo_vencimiento: proximo,
        semaforo: proximo ? semaforo(proximo, parametros) : null
    };
};

const validarProducto = async (datos, idActual = null) => {
    exigirTexto(datos.codigo, 'El código es obligatorio.');
    exigirTexto(datos.nombre, 'El nombre es obligatorio.');
    if (!datos.id_forma_farmaceutica) throw new ErrorNegocio('Selecciona la forma farmacéutica.');
    if (!datos.id_unidad_medida) throw new ErrorNegocio('Selecciona la unidad de medida.');
    if (datos.stock_minimo !== undefined && (Number(datos.stock_minimo) < 0 || !Number.isFinite(Number(datos.stock_minimo)))) {
        throw new ErrorNegocio('El stock mínimo no puede ser negativo.');
    }
    // Un producto debe existir una sola vez: mismo nombre + concentración + forma
    const duplicado = await Producto.findOne({
        where: {
            [Op.and]: [
                sqlWhere(fn('lower', col('nombre')), datos.nombre.trim().toLowerCase()),
                sqlWhere(fn('lower', fn('coalesce', col('concentracion'), '')), (datos.concentracion || '').trim().toLowerCase()),
                { id_forma_farmaceutica: datos.id_forma_farmaceutica },
                ...(idActual ? [{ id_producto: { [Op.ne]: idActual } }] : [])
            ]
        }
    });
    if (duplicado) {
        throw new ErrorNegocio(`Ya existe el producto "${duplicado.nombre}" (${duplicado.codigo}) con la misma concentración y forma. Registra un nuevo lote de ese producto en lugar de crear otro.`, 409);
    }
};

const tomarCampos = (body) => {
    const datos = {};
    CAMPOS.forEach(c => { if (body[c] !== undefined) datos[c] = body[c] === '' ? null : body[c]; });
    return datos;
};

// Lista de productos con su existencia y próximo vencimiento
const getProductos = async (req, res) => {
    try {
        const parametros = await obtenerParametros();
        const where = req.query.activos ? { activo: true } : {};
        const productos = await Producto.findAll({
            where,
            include: [
                ...INCLUDE_CATALOGOS,
                { model: Lote, attributes: ['cantidad_disponible', 'condicion', 'fecha_vencimiento'], required: false }
            ],
            order: [['nombre', 'ASC']]
        });
        res.json(productos.map(p => {
            const { Lotes, ...datos } = p.get({ plain: true });
            const resumen = resumirLotes(Lotes || [], parametros);
            return { ...datos, ...resumen, total_lotes: (Lotes || []).length, bajo_minimo: resumen.existencia < Number(datos.stock_minimo || 0) };
        }));
    } catch (error) { manejarError(res, error, 'Error al obtener productos'); }
};

// Ficha del producto: datos, existencia y TODOS sus lotes con origen y kárdex
const getProducto = async (req, res) => {
    try {
        const parametros = await obtenerParametros();
        const producto = await Producto.findByPk(req.params.id, { include: INCLUDE_CATALOGOS });
        if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

        const lotes = await Lote.findAll({
            where: { id_producto: producto.id_producto },
            include: [
                { model: Laboratorio, attributes: ['id_laboratorio', 'nombre'] },
                { model: Ubicacion, attributes: ['nombre'] },
                { model: Ingreso, attributes: ['id_ingreso', 'serie_factura', 'numero_factura', 'fecha_recepcion', 'fecha_factura'], include: [{ model: Proveedor, attributes: ['nombre', 'nit'] }] }
            ],
            order: [['fecha_vencimiento', 'ASC']]
        });

        const movimientos = await Movimiento.findAll({
            include: [
                { model: Lote, attributes: ['numero_lote'], where: { id_producto: producto.id_producto } },
                { model: MotivoMovimiento, attributes: ['nombre'] },
                { model: Usuario, attributes: ['nombre', 'apellido'] },
                { model: Pedido, attributes: ['numero_pedido'] }
            ],
            order: [['fecha_movimiento', 'DESC'], ['id_movimiento', 'DESC']],
            limit: 300
        });

        res.json({
            producto,
            resumen: resumirLotes(lotes, parametros),
            lotes: lotes.map(l => ({ ...l.get({ plain: true }), semaforo: semaforo(l.fecha_vencimiento, parametros) })),
            movimientos
        });
    } catch (error) { manejarError(res, error, 'Error al obtener producto'); }
};

const createProducto = async (req, res) => {
    try {
        const datos = tomarCampos(req.body);
        await validarProducto(datos);
        const producto = await Producto.create(datos);
        await registrarAuditoria({ req, tabla: 'productos', id_registro: producto.id_producto, accion: 'crear', despues: producto });
        res.status(201).json({ mensaje: 'Producto creado exitosamente', producto });
    } catch (error) { manejarError(res, error, 'Error al crear producto'); }
};

const updateProducto = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });
        const antes = instantanea(producto);
        const datos = tomarCampos(req.body);
        await validarProducto({ ...antes, ...datos }, producto.id_producto);
        await producto.update(datos);
        await registrarAuditoria({ req, tabla: 'productos', id_registro: producto.id_producto, accion: 'editar', antes, despues: producto, motivo: req.body.motivo });
        res.json({ mensaje: 'Producto actualizado exitosamente', producto });
    } catch (error) { manejarError(res, error, 'Error al actualizar producto'); }
};

// Anular en lugar de borrar: el producto deja de aparecer para nuevas
// operaciones pero conserva todo su historial.
const anularProducto = async (req, res) => {
    try {
        const motivo = exigirTexto(req.body?.motivo, 'Indica el motivo de la anulación.');
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });
        if (!producto.activo) throw new ErrorNegocio('El producto ya está anulado.');
        const conExistencia = await Lote.count({
            where: { id_producto: producto.id_producto, cantidad_disponible: { [Op.gt]: 0 }, condicion: { [Op.ne]: 'anulado' } }
        });
        if (conExistencia) throw new ErrorNegocio('No se puede anular: el producto todavía tiene existencia en lotes.');
        const antes = instantanea(producto);
        await producto.update({ activo: false });
        await registrarAuditoria({ req, tabla: 'productos', id_registro: producto.id_producto, accion: 'anular', antes, despues: producto, motivo });
        res.json({ mensaje: 'Producto anulado. Puede restaurarse cuando se necesite.' });
    } catch (error) { manejarError(res, error, 'Error al anular producto'); }
};

const restaurarProducto = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });
        if (producto.activo) throw new ErrorNegocio('El producto ya está activo.');
        const antes = instantanea(producto);
        await producto.update({ activo: true });
        await registrarAuditoria({ req, tabla: 'productos', id_registro: producto.id_producto, accion: 'restaurar', antes, despues: producto, motivo: req.body?.motivo });
        res.json({ mensaje: 'Producto restaurado.' });
    } catch (error) { manejarError(res, error, 'Error al restaurar producto'); }
};

module.exports = { getProductos, getProducto, createProducto, updateProducto, anularProducto, restaurarProducto, resumirLotes };
