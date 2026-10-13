// Contratos de GUATECOMPRAS con sus renglones. El avance (pedido, entregado
// y saldo por renglón) se calcula a partir de los pedidos.
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
    Contrato, Institucion, Usuario, DetalleContrato, Producto, ModalidadCompra, Pedido, DetallePedido,
    UnidadMedida
} = require('../models/index');
const { manejarError, ErrorNegocio, exigirTexto, exigirCantidad } = require('../utils/errores');
const { registrarAuditoria, instantanea } = require('../utils/auditoria');
const { obtenerParametro } = require('../services/parametros');
const { redondear } = require('../services/inventario');
const { hoy, esFechaValida, diasEntre } = require('../utils/fechas');

const INCLUDE_CONTRATO = [
    { model: Institucion, attributes: ['id_institucion', 'nombre', 'nit', 'departamento'] },
    { model: ModalidadCompra, attributes: ['id_modalidad', 'nombre'] },
    { model: Usuario, attributes: ['nombre', 'apellido'] }
];

const INCLUDE_RENGLONES = {
    model: DetalleContrato,
    include: [{ model: Producto, attributes: ['id_producto', 'nombre', 'codigo', 'concentracion'], include: [{ model: UnidadMedida, attributes: ['nombre'] }] }]
};

// Cantidad pedida (pedidos no anulados) y entregada (pedidos entregados) por renglón
const calcularAvance = async (idsRenglones, transaction) => {
    const avance = {};
    if (!idsRenglones.length) return avance;
    const detalles = await DetallePedido.findAll({
        where: { id_detalle_contrato: idsRenglones },
        include: [{ model: Pedido, attributes: ['estado'], where: { estado: { [Op.ne]: 'anulado' } } }],
        transaction
    });
    detalles.forEach(d => {
        const a = avance[d.id_detalle_contrato] || (avance[d.id_detalle_contrato] = { pedida: 0, entregada: 0 });
        a.pedida += Number(d.cantidad);
        if (d.Pedido.estado === 'entregado') a.entregada += Number(d.cantidad);
    });
    return avance;
};

const conAvance = (contrato, avance) => {
    const datos = contrato.get({ plain: true });
    let montoEntregado = 0;
    const renglones = (datos.DetalleContratos || [])
        .filter(r => r.activo)
        .sort((a, b) => a.numero_renglon - b.numero_renglon)
        .map(r => {
            const a = avance[r.id_detalle_contrato] || { pedida: 0, entregada: 0 };
            montoEntregado += a.entregada * Number(r.precio_unitario);
            return {
                ...r,
                cantidad_pedida: redondear(a.pedida),
                cantidad_entregada: redondear(a.entregada),
                saldo_por_pedir: redondear(Number(r.cantidad_contratada) - a.pedida),
                saldo_por_entregar: redondear(Number(r.cantidad_contratada) - a.entregada)
            };
        });
    delete datos.DetalleContratos;
    const monto = Number(datos.monto_total) || 0;
    return {
        ...datos,
        renglones,
        monto_entregado: redondear(montoEntregado),
        porcentaje_avance: monto > 0 ? Math.round((montoEntregado / monto) * 100) : 0,
        dias_para_fin: diasEntre(hoy(), datos.fecha_fin),
        tiene_saldo: renglones.some(r => r.saldo_por_entregar > 0)
    };
};

const cargarConAvance = async (where, transaction) => {
    const contratos = await Contrato.findAll({
        where, include: [...INCLUDE_CONTRATO, INCLUDE_RENGLONES],
        order: [['fecha_fin', 'ASC'], ['id_contrato', 'ASC']],
        transaction
    });
    const ids = contratos.flatMap(c => c.DetalleContratos.map(r => r.id_detalle_contrato));
    const avance = await calcularAvance(ids, transaction);
    return contratos.map(c => conAvance(c, avance));
};

// Filtros: estado, id_institucion
const getContratos = async (req, res) => {
    try {
        const where = {};
        if (req.query.estado) where.estado = req.query.estado;
        if (req.query.id_institucion) where.id_institucion = req.query.id_institucion;
        res.json(await cargarConAvance(where));
    } catch (error) { manejarError(res, error, 'Error al obtener contratos'); }
};

const getContrato = async (req, res) => {
    try {
        const [contrato] = await cargarConAvance({ id_contrato: req.params.id });
        if (!contrato) return res.status(404).json({ mensaje: 'Contrato no encontrado' });
        const pedidos = await Pedido.findAll({
            where: { id_contrato: contrato.id_contrato },
            order: [['fecha_programada', 'DESC']],
            attributes: ['id_pedido', 'numero_pedido', 'estado', 'fecha_programada', 'fecha_real_entrega', 'monto_total']
        });
        res.json({ ...contrato, pedidos });
    } catch (error) { manejarError(res, error, 'Error al obtener contrato'); }
};

const validarEncabezado = async (d) => {
    exigirTexto(d.numero_contrato, 'El número de contrato es obligatorio.');
    exigirTexto(d.nog, 'El NOG (Número de Operación Guatecompras) es obligatorio.');
    if (!/^\d{4,12}$/.test(String(d.nog).trim())) throw new ErrorNegocio('El NOG debe contener solo números (entre 4 y 12 dígitos).');
    const institucion = await Institucion.findByPk(d.id_institucion);
    if (!institucion || !institucion.activo) throw new ErrorNegocio('Selecciona una institución activa.');
    if (!(await ModalidadCompra.findByPk(d.id_modalidad))) throw new ErrorNegocio('Selecciona la modalidad de compra.');
    if (!esFechaValida(d.fecha_inicio) || !esFechaValida(d.fecha_fin)) throw new ErrorNegocio('Las fechas de inicio y fin son obligatorias.');
    if (d.fecha_fin <= d.fecha_inicio) throw new ErrorNegocio('La fecha de fin debe ser posterior a la fecha de inicio.');
    if (d.vigencia_minima_meses !== null && d.vigencia_minima_meses !== undefined && d.vigencia_minima_meses !== '') {
        const v = Number(d.vigencia_minima_meses);
        if (!Number.isInteger(v) || v < 0 || v > 60) throw new ErrorNegocio('La vida útil mínima debe ser un número de meses entre 0 y 60.');
    }
};

const validarRenglones = async (renglones) => {
    if (!Array.isArray(renglones) || renglones.length === 0) throw new ErrorNegocio('Agrega al menos un renglón (producto) al contrato.');
    const productos = new Set();
    for (const [i, r] of renglones.entries()) {
        const p = await Producto.findByPk(r.id_producto);
        if (!p) throw new ErrorNegocio(`Renglón ${i + 1}: selecciona un producto.`);
        if (productos.has(String(r.id_producto))) throw new ErrorNegocio(`Renglón ${i + 1}: el producto "${p.nombre}" ya está en otro renglón.`);
        productos.add(String(r.id_producto));
        exigirCantidad(r.cantidad_contratada, `Renglón ${i + 1}: la cantidad debe ser mayor que cero.`);
        exigirCantidad(r.precio_unitario, `Renglón ${i + 1}: el precio debe ser mayor que cero.`);
    }
};

const ENCABEZADO = ['numero_contrato', 'nog', 'id_institucion', 'id_modalidad', 'fecha_inicio', 'fecha_fin', 'vigencia_minima_meses', 'observaciones'];

const tomarEncabezado = (body) => {
    const d = {};
    ENCABEZADO.forEach(c => { if (body[c] !== undefined) d[c] = body[c] === '' ? null : body[c]; });
    if (d.nog) d.nog = String(d.nog).trim();
    if (d.numero_contrato) d.numero_contrato = String(d.numero_contrato).trim();
    return d;
};

const createContrato = async (req, res) => {
    try {
        const datos = tomarEncabezado(req.body);
        const renglones = req.body.renglones;
        await validarEncabezado(datos);
        await validarRenglones(renglones);

        const contrato = await sequelize.transaction(async (transaction) => {
            const monto = redondear(renglones.reduce((s, r) => s + Number(r.cantidad_contratada) * Number(r.precio_unitario), 0));
            const nuevo = await Contrato.create({
                ...datos, id_usuario: req.usuario.id, monto_total: monto,
                estado: datos.fecha_fin < hoy() ? 'vencido' : 'vigente'
            }, { transaction });
            for (const [i, r] of renglones.entries()) {
                await DetalleContrato.create({
                    id_contrato: nuevo.id_contrato,
                    numero_renglon: i + 1,
                    id_producto: r.id_producto,
                    cantidad_contratada: r.cantidad_contratada,
                    precio_unitario: r.precio_unitario,
                    subtotal: redondear(Number(r.cantidad_contratada) * Number(r.precio_unitario))
                }, { transaction });
            }
            const completo = await Contrato.findByPk(nuevo.id_contrato, { include: [INCLUDE_RENGLONES], transaction });
            await registrarAuditoria({ req, tabla: 'contratos', id_registro: nuevo.id_contrato, accion: 'crear', despues: completo, transaction });
            return nuevo;
        });
        res.status(201).json({ mensaje: 'Contrato creado exitosamente', contrato });
    } catch (error) { manejarError(res, error, 'Error al crear contrato'); }
};

// Actualiza encabezado y renglones. Un renglón que ya tiene pedidos no puede
// cambiar de producto, ni bajar su cantidad por debajo de lo ya pedido, ni
// quitarse del contrato.
const updateContrato = async (req, res) => {
    try {
        const motivo = exigirTexto(req.body.motivo, 'Indica el motivo de la modificación del contrato.');
        await sequelize.transaction(async (transaction) => {
            const contrato = await Contrato.findByPk(req.params.id, { include: [INCLUDE_RENGLONES], transaction, lock: { level: transaction.LOCK.UPDATE, of: Contrato } });
            if (!contrato) throw new ErrorNegocio('Contrato no encontrado', 404);
            if (['anulado', 'cancelado', 'completado'].includes(contrato.estado)) throw new ErrorNegocio(`Un contrato ${contrato.estado} no se puede modificar.`);
            const antes = instantanea(contrato);

            const datos = { ...antes, ...tomarEncabezado(req.body) };
            await validarEncabezado(datos);
            const renglones = req.body.renglones;
            await validarRenglones(renglones);

            const existentes = contrato.DetalleContratos;
            const avance = await calcularAvance(existentes.map(r => r.id_detalle_contrato), transaction);
            const enviados = new Set();

            for (const [i, r] of renglones.entries()) {
                const previo = existentes.find(e => String(e.id_producto) === String(r.id_producto));
                const subtotal = redondear(Number(r.cantidad_contratada) * Number(r.precio_unitario));
                if (previo) {
                    enviados.add(previo.id_detalle_contrato);
                    const pedida = avance[previo.id_detalle_contrato]?.pedida || 0;
                    if (Number(r.cantidad_contratada) < pedida) {
                        throw new ErrorNegocio(`Renglón ${i + 1}: ya se pidieron ${pedida} unidades; la cantidad contratada no puede ser menor.`);
                    }
                    await previo.update({
                        numero_renglon: i + 1, cantidad_contratada: r.cantidad_contratada,
                        precio_unitario: r.precio_unitario, subtotal, activo: true
                    }, { transaction });
                } else {
                    await DetalleContrato.create({
                        id_contrato: contrato.id_contrato, numero_renglon: i + 1, id_producto: r.id_producto,
                        cantidad_contratada: r.cantidad_contratada, precio_unitario: r.precio_unitario, subtotal
                    }, { transaction });
                }
            }
            for (const e of existentes.filter(x => x.activo && !enviados.has(x.id_detalle_contrato))) {
                if ((avance[e.id_detalle_contrato]?.pedida || 0) > 0) {
                    throw new ErrorNegocio(`No se puede quitar el renglón de "${e.Producto?.nombre}": ya tiene pedidos.`);
                }
                await e.update({ activo: false }, { transaction });
            }

            const monto = redondear(renglones.reduce((s, r) => s + Number(r.cantidad_contratada) * Number(r.precio_unitario), 0));
            const encabezado = tomarEncabezado(req.body);
            if (encabezado.fecha_fin) encabezado.estado = encabezado.fecha_fin < hoy() ? 'vencido' : 'vigente';
            await contrato.update({ ...encabezado, monto_total: monto }, { transaction });
            const despues = await Contrato.findByPk(contrato.id_contrato, { include: [INCLUDE_RENGLONES], transaction });
            await registrarAuditoria({ req, tabla: 'contratos', id_registro: contrato.id_contrato, accion: 'editar', antes, despues, motivo, transaction });
        });
        res.json({ mensaje: 'Contrato actualizado exitosamente' });
    } catch (error) { manejarError(res, error, 'Error al actualizar contrato'); }
};

// Cancelar / anular / reactivar el contrato (nunca se borra)
const cambiarEstadoContrato = async (req, res) => {
    try {
        const { estado } = req.body;
        const motivo = exigirTexto(req.body.motivo, 'Indica el motivo del cambio de estado.');
        if (!['cancelado', 'anulado', 'vigente'].includes(estado)) throw new ErrorNegocio('Estado no válido.');
        await sequelize.transaction(async (transaction) => {
            const contrato = await Contrato.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!contrato) throw new ErrorNegocio('Contrato no encontrado', 404);
            const enCurso = await Pedido.count({
                where: { id_contrato: contrato.id_contrato, estado: { [Op.notIn]: ['entregado', 'anulado'] } }, transaction
            });
            let nuevo = estado;
            if (estado === 'vigente') {
                if (!['cancelado', 'anulado'].includes(contrato.estado)) throw new ErrorNegocio('Solo se puede reactivar un contrato cancelado o anulado.');
                nuevo = contrato.fecha_fin < hoy() ? 'vencido' : 'vigente';
            } else {
                if (contrato.estado === estado) throw new ErrorNegocio(`El contrato ya está ${estado}.`);
                if (enCurso) throw new ErrorNegocio(`El contrato tiene ${enCurso} pedido(s) en curso; entrégalos o anúlalos primero.`);
                if (estado === 'anulado') {
                    const entregados = await Pedido.count({ where: { id_contrato: contrato.id_contrato, estado: 'entregado' }, transaction });
                    if (entregados) throw new ErrorNegocio('El contrato ya tiene entregas; usa "cancelar" en lugar de anular.');
                }
            }
            const antes = instantanea(contrato);
            await contrato.update({ estado: nuevo }, { transaction });
            await registrarAuditoria({ req, tabla: 'contratos', id_registro: contrato.id_contrato, accion: 'cambio_estado', antes, despues: contrato, motivo, transaction });
        });
        res.json({ mensaje: 'Estado del contrato actualizado' });
    } catch (error) { manejarError(res, error, 'Error al cambiar el estado del contrato'); }
};

// Si todos los renglones ya se entregaron completos, el contrato pasa a completado
const verificarContratoCompletado = async (id_contrato, req, transaction) => {
    const contrato = await Contrato.findByPk(id_contrato, { include: [INCLUDE_RENGLONES], transaction });
    if (!contrato || !['vigente', 'vencido'].includes(contrato.estado)) return;
    const activos = contrato.DetalleContratos.filter(r => r.activo);
    const avance = await calcularAvance(activos.map(r => r.id_detalle_contrato), transaction);
    const completo = activos.length > 0 && activos.every(r => (avance[r.id_detalle_contrato]?.entregada || 0) >= Number(r.cantidad_contratada));
    if (completo) {
        const antes = instantanea(contrato);
        await contrato.update({ estado: 'completado' }, { transaction });
        await registrarAuditoria({ req, tabla: 'contratos', id_registro: id_contrato, accion: 'cambio_estado', antes, despues: contrato, motivo: 'Todos los renglones fueron entregados', transaction });
    }
};

// Vida útil mínima que exige el contrato al despachar
const vigenciaDelContrato = async (contrato) =>
    contrato.vigencia_minima_meses !== null && contrato.vigencia_minima_meses !== undefined
        ? Number(contrato.vigencia_minima_meses)
        : obtenerParametro('VIGENCIA_MINIMA_DESPACHO_MESES');

module.exports = {
    getContratos, getContrato, createContrato, updateContrato, cambiarEstadoContrato,
    calcularAvance, cargarConAvance, verificarContratoCompletado, vigenciaDelContrato, INCLUDE_RENGLONES
};
