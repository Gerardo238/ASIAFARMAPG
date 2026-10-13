// Ingresos de compra: la única forma de que entre un lote nuevo al inventario.
// Cada línea de la factura crea su propio lote (nunca se suma a un lote
// existente), con su laboratorio, fechas, costo y la factura de origen.
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
    Ingreso, Lote, Proveedor, Producto, Laboratorio, Ubicacion, Usuario, Movimiento
} = require('../models/index');
const { manejarError, ErrorNegocio, exigirTexto, exigirCantidad } = require('../utils/errores');
const { registrarAuditoria, instantanea } = require('../utils/auditoria');
const { obtenerParametro } = require('../services/parametros');
const { validarFechasLote, registrarMovimiento, obtenerMotivo, redondear } = require('../services/inventario');
const { hoy, esFechaValida } = require('../utils/fechas');

const INCLUDE_INGRESO = [
    { model: Proveedor, attributes: ['id_proveedor', 'nombre', 'nit'] },
    { model: Usuario, attributes: ['nombre', 'apellido'] }
];

const INCLUDE_LOTES = {
    model: Lote,
    include: [
        { model: Producto, attributes: ['id_producto', 'codigo', 'nombre', 'concentracion'] },
        { model: Laboratorio, attributes: ['nombre'] },
        { model: Ubicacion, attributes: ['nombre'] }
    ]
};

const getIngresos = async (req, res) => {
    try {
        const ingresos = await Ingreso.findAll({
            include: [...INCLUDE_INGRESO, { model: Lote, attributes: ['id_lote'] }],
            order: [['fecha_recepcion', 'DESC'], ['id_ingreso', 'DESC']]
        });
        res.json(ingresos.map(i => {
            const { Lotes, ...datos } = i.get({ plain: true });
            return { ...datos, total_lotes: Lotes.length };
        }));
    } catch (error) { manejarError(res, error, 'Error al obtener ingresos'); }
};

const getIngreso = async (req, res) => {
    try {
        const ingreso = await Ingreso.findByPk(req.params.id, { include: [...INCLUDE_INGRESO, INCLUDE_LOTES] });
        if (!ingreso) return res.status(404).json({ mensaje: 'Ingreso no encontrado' });
        res.json(ingreso);
    } catch (error) { manejarError(res, error, 'Error al obtener ingreso'); }
};

const createIngreso = async (req, res) => {
    try {
        const { id_proveedor, serie_factura, numero_factura, fecha_factura, fecha_recepcion, observaciones, lotes } = req.body;
        const fechaHoy = hoy();

        const proveedor = await Proveedor.findByPk(id_proveedor);
        if (!proveedor || !proveedor.activo) throw new ErrorNegocio('Selecciona un proveedor activo.');
        exigirTexto(serie_factura, 'La serie de la factura es obligatoria.');
        exigirTexto(numero_factura, 'El número de factura es obligatorio.');
        if (!esFechaValida(fecha_factura) || fecha_factura > fechaHoy) throw new ErrorNegocio('La fecha de la factura es obligatoria y no puede ser futura.');
        if (!esFechaValida(fecha_recepcion) || fecha_recepcion > fechaHoy) throw new ErrorNegocio('La fecha de recepción es obligatoria y no puede ser futura.');
        if (fecha_recepcion < fecha_factura) throw new ErrorNegocio('La fecha de recepción no puede ser anterior a la fecha de la factura.');
        if (!Array.isArray(lotes) || lotes.length === 0) throw new ErrorNegocio('Agrega al menos un lote a la factura.');

        const vigenciaMinima = await obtenerParametro('VIGENCIA_MINIMA_INGRESO_MESES');
        const vistos = new Set();

        // Validación de cada línea antes de tocar la base de datos
        for (const [i, l] of lotes.entries()) {
            const linea = `Línea ${i + 1}: `;
            try {
                const producto = await Producto.findByPk(l.id_producto);
                if (!producto || !producto.activo) throw new ErrorNegocio('selecciona un producto activo.');
                const laboratorio = await Laboratorio.findByPk(l.id_laboratorio);
                if (!laboratorio || !laboratorio.activo) throw new ErrorNegocio('selecciona el laboratorio fabricante.');
                if (!l.id_ubicacion) throw new ErrorNegocio('selecciona la ubicación.');
                exigirTexto(l.numero_lote, 'el número de lote es obligatorio.');
                exigirCantidad(l.cantidad, 'la cantidad debe ser mayor que cero.');
                if (Number(l.costo_unitario || 0) < 0) throw new ErrorNegocio('el costo no puede ser negativo.');
                validarFechasLote(l, { vigenciaMinimaMeses: vigenciaMinima });
                const clave = `${l.id_producto}|${String(l.numero_lote).trim().toUpperCase()}`;
                if (vistos.has(clave)) throw new ErrorNegocio('el mismo lote del mismo producto aparece dos veces en la factura.');
                vistos.add(clave);
            } catch (e) {
                if (e instanceof ErrorNegocio) throw new ErrorNegocio(linea + e.message);
                throw e;
            }
        }

        const ingreso = await sequelize.transaction(async (transaction) => {
            const motivo = await obtenerMotivo('COMPRA', transaction);
            const nuevo = await Ingreso.create({
                id_proveedor, serie_factura: serie_factura.trim(), numero_factura: numero_factura.trim(),
                fecha_factura, fecha_recepcion, observaciones, id_usuario: req.usuario.id,
                monto_total: redondear(lotes.reduce((s, l) => s + Number(l.cantidad) * Number(l.costo_unitario || 0), 0))
            }, { transaction });

            for (const l of lotes) {
                const lote = await Lote.create({
                    id_ingreso: nuevo.id_ingreso,
                    id_producto: l.id_producto,
                    id_laboratorio: l.id_laboratorio,
                    numero_lote: String(l.numero_lote).trim().toUpperCase(),
                    fecha_fabricacion: l.fecha_fabricacion,
                    fecha_vencimiento: l.fecha_vencimiento,
                    cantidad_recibida: Number(l.cantidad),
                    cantidad_disponible: 0,
                    costo_unitario: Number(l.costo_unitario || 0),
                    id_ubicacion: l.id_ubicacion,
                    condicion: 'disponible'
                }, { transaction });
                await registrarMovimiento({
                    lote, tipo: 'entrada', cantidad: l.cantidad, motivo, id_usuario: req.usuario.id,
                    id_ingreso: nuevo.id_ingreso, observacion: `Factura ${nuevo.serie_factura}-${nuevo.numero_factura}`, transaction
                });
                await registrarAuditoria({ req, tabla: 'lotes', id_registro: lote.id_lote, accion: 'crear', despues: lote, transaction });
            }
            await registrarAuditoria({ req, tabla: 'ingresos', id_registro: nuevo.id_ingreso, accion: 'crear', despues: nuevo, transaction });
            return nuevo;
        });

        res.status(201).json({ mensaje: `Ingreso registrado con ${lotes.length} lote(s)`, ingreso });
    } catch (error) { manejarError(res, error, 'Error al registrar el ingreso'); }
};

// Anula la factura completa: saca del inventario sus lotes. Solo se permite
// si todavía no se ha despachado nada de esos lotes.
const anularIngreso = async (req, res) => {
    try {
        const motivoTexto = exigirTexto(req.body?.motivo, 'Indica el motivo de la anulación.');
        await sequelize.transaction(async (transaction) => {
            const ingreso = await Ingreso.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!ingreso) throw new ErrorNegocio('Ingreso no encontrado', 404);
            if (ingreso.estado === 'anulado') throw new ErrorNegocio('El ingreso ya está anulado.');
            const lotes = await Lote.findAll({ where: { id_ingreso: ingreso.id_ingreso }, transaction, lock: transaction.LOCK.UPDATE });
            const motivo = await obtenerMotivo('ANULACION_INGRESO', transaction);

            for (const lote of lotes) {
                // Las salidas de una anulación anterior (luego restaurada) no cuentan
                const salidas = await Movimiento.count({
                    where: { id_lote: lote.id_lote, tipo_movimiento: 'salida', id_motivo: { [Op.ne]: motivo.id_motivo } },
                    transaction
                });
                if (salidas > 0) {
                    throw new ErrorNegocio(`No se puede anular: el lote ${lote.numero_lote} ya tiene salidas registradas. Corrige con un ajuste de inventario.`);
                }
            }

            for (const lote of lotes) {
                const antes = instantanea(lote);
                if (Number(lote.cantidad_disponible) > 0) {
                    await registrarMovimiento({
                        lote, tipo: 'salida', cantidad: lote.cantidad_disponible, motivo, id_usuario: req.usuario.id,
                        id_ingreso: ingreso.id_ingreso, observacion: motivoTexto, transaction
                    });
                }
                await lote.update({ condicion: 'anulado', motivo_condicion: motivoTexto }, { transaction });
                await registrarAuditoria({ req, tabla: 'lotes', id_registro: lote.id_lote, accion: 'anular', antes, despues: lote, motivo: motivoTexto, transaction });
            }
            const antes = instantanea(ingreso);
            await ingreso.update({ estado: 'anulado' }, { transaction });
            await registrarAuditoria({ req, tabla: 'ingresos', id_registro: ingreso.id_ingreso, accion: 'anular', antes, despues: ingreso, motivo: motivoTexto, transaction });
        });
        res.json({ mensaje: 'Ingreso anulado. Puede restaurarse si fue un error.' });
    } catch (error) { manejarError(res, error, 'Error al anular el ingreso'); }
};

// Revierte una anulación hecha por error: los lotes vuelven al inventario
const restaurarIngreso = async (req, res) => {
    try {
        const motivoTexto = exigirTexto(req.body?.motivo, 'Indica el motivo de la restauración.');
        await sequelize.transaction(async (transaction) => {
            const ingreso = await Ingreso.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!ingreso) throw new ErrorNegocio('Ingreso no encontrado', 404);
            if (ingreso.estado !== 'anulado') throw new ErrorNegocio('El ingreso no está anulado.');
            const lotes = await Lote.findAll({ where: { id_ingreso: ingreso.id_ingreso }, transaction, lock: transaction.LOCK.UPDATE });
            const motivo = await obtenerMotivo('RESTAURACION_INGRESO', transaction);
            const fechaHoy = hoy();

            for (const lote of lotes) {
                const antes = instantanea(lote);
                await lote.update({
                    condicion: lote.fecha_vencimiento < fechaHoy ? 'vencido' : 'disponible',
                    motivo_condicion: `Restaurado: ${motivoTexto}`
                }, { transaction });
                await registrarMovimiento({
                    lote, tipo: 'entrada', cantidad: lote.cantidad_recibida, motivo, id_usuario: req.usuario.id,
                    id_ingreso: ingreso.id_ingreso, observacion: motivoTexto, transaction
                });
                await registrarAuditoria({ req, tabla: 'lotes', id_registro: lote.id_lote, accion: 'restaurar', antes, despues: lote, motivo: motivoTexto, transaction });
            }
            const antes = instantanea(ingreso);
            await ingreso.update({ estado: 'registrado' }, { transaction });
            await registrarAuditoria({ req, tabla: 'ingresos', id_registro: ingreso.id_ingreso, accion: 'restaurar', antes, despues: ingreso, motivo: motivoTexto, transaction });
        });
        res.json({ mensaje: 'Ingreso restaurado y sus lotes volvieron al inventario.' });
    } catch (error) { manejarError(res, error, 'Error al restaurar el ingreso'); }
};

module.exports = { getIngresos, getIngreso, createIngreso, anularIngreso, restaurarIngreso };
