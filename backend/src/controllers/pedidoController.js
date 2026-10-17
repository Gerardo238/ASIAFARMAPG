// Pedidos de una institución bajo un contrato. Flujo:
//   pendiente -> en_preparacion (el sistema asigna lotes por FEFO y descuenta
//   inventario) -> empacado -> en_transporte -> entregado
// Cada cambio de etapa queda en el seguimiento con usuario y fecha. Un pedido
// entregado puede tener devoluciones de la institución (producto vencido,
// dañado...), que regresan el producto a sus lotes y la cantidad al contrato.
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
    Pedido, Contrato, Institucion, Usuario, DetallePedido, DetalleContrato, Producto, Lote, Laboratorio,
    AsignacionLote, SeguimientoPedido, UnidadMedida, ModalidadCompra, DevolucionPedido, DetalleDevolucion, TramiteContrato
} = require('../models/index');
const { manejarError, ErrorNegocio, exigirTexto, exigirCantidad } = require('../utils/errores');
const { registrarAuditoria, instantanea } = require('../utils/auditoria');
const { proponerFEFO, existenciaApta, registrarMovimiento, obtenerMotivo, redondear } = require('../services/inventario');
const {
    calcularAvance, verificarContratoCompletado, reabrirContrato, vigenciaDelContrato, plazoEntrega, ATRIBUTOS_MODALIDAD
} = require('./contratoController');
const { calcularRetraso, fechaLimite, esEntregaProxima } = require('../services/analisis');
const { obtenerParametro } = require('../services/parametros');
const { hoy, esFechaValida, diasEntre, sumarDiasHabiles, formatoGT } = require('../utils/fechas');

const ETIQUETAS = {
    pendiente: 'Pendiente', en_preparacion: 'En preparación', empacado: 'Empacado',
    en_transporte: 'En transporte', entregado: 'Entregado', anulado: 'Anulado'
};

// Por qué devuelve la institución
const CAUSAS_DEVOLUCION = {
    producto_vencido: 'Producto vencido', vida_util_insuficiente: 'Vida útil menor a la exigida',
    producto_danado: 'Producto dañado o en mal estado', error_despacho: 'Producto o cantidad equivocada',
    no_solicitado: 'La institución no lo solicitó', otra: 'Otra causa'
};

const INCLUDE_CONTRATO = {
    model: Contrato,
    attributes: ['id_contrato', 'numero_contrato', 'nog', 'estado', 'vigencia_minima_meses', 'fecha_inicio', 'fecha_fin', 'id_modalidad'],
    include: [
        { model: Institucion, attributes: ['id_institucion', 'nombre', 'departamento'] },
        { model: ModalidadCompra, attributes: ATRIBUTOS_MODALIDAD }
    ]
};

// Agrega retraso (días hábiles), la alerta preventiva de entrega
// (diasAlerta = parámetro DIAS_ALERTA_PEDIDO) y lo devuelto por la institución
const conRetraso = (pedido, diasAlerta, unidadesDevueltas = 0) => {
    const datos = typeof pedido.get === 'function' ? pedido.get({ plain: true }) : pedido;
    const dias_retraso = calcularRetraso(datos);
    return {
        ...datos, dias_retraso, retrasado: dias_retraso > 0,
        fecha_limite: fechaLimite(datos),
        dias_para_entrega: diasEntre(hoy(), fechaLimite(datos)),
        entrega_proxima: esEntregaProxima(datos, diasAlerta),
        unidades_devueltas: redondear(unidadesDevueltas)
    };
};

// Unidades devueltas (devoluciones vigentes) de cada pedido: { id_pedido: unidades }
const devueltoPorPedido = async (ids) => {
    const where = { estado: 'registrada', ...(ids ? { id_pedido: ids } : {}) };
    const devoluciones = await DevolucionPedido.findAll({ where, attributes: ['id_pedido', 'unidades'] });
    const mapa = {};
    devoluciones.forEach(d => { mapa[d.id_pedido] = (mapa[d.id_pedido] || 0) + Number(d.unidades); });
    return mapa;
};

// Filtros: estado, id_contrato, id_institucion, retrasados=1, proximos=1
const getPedidos = async (req, res) => {
    try {
        const { estado, id_contrato, id_institucion, retrasados, proximos } = req.query;
        const diasAlerta = await obtenerParametro('DIAS_ALERTA_PEDIDO');
        const where = {};
        if (estado) where.estado = estado;
        if (id_contrato) where.id_contrato = id_contrato;
        if (id_institucion) where['$Contrato.id_institucion$'] = id_institucion;
        const [pedidos, devueltos] = await Promise.all([
            Pedido.findAll({
                where,
                include: [INCLUDE_CONTRATO, { model: Usuario, attributes: ['nombre', 'apellido'] }],
                order: [['fecha_programada', 'DESC'], ['id_pedido', 'DESC']]
            }),
            devueltoPorPedido()
        ]);
        let lista = pedidos.map(p => conRetraso(p, diasAlerta, devueltos[p.id_pedido]));
        if (retrasados) lista = lista.filter(p => p.retrasado && p.estado !== 'entregado');
        if (proximos) lista = lista.filter(p => p.entrega_proxima);
        res.json(lista);
    } catch (error) { manejarError(res, error, 'Error al obtener pedidos'); }
};

const cargarPedido = (id, transaction) => Pedido.findByPk(id, {
    include: [
        INCLUDE_CONTRATO,
        { model: Usuario, attributes: ['nombre', 'apellido'] },
        {
            model: DetallePedido,
            include: [
                { model: Producto, attributes: ['id_producto', 'nombre', 'codigo', 'concentracion'], include: [{ model: UnidadMedida, attributes: ['nombre'] }] },
                { model: DetalleContrato, attributes: ['numero_renglon'] },
                {
                    model: AsignacionLote,
                    include: [{ model: Lote, attributes: ['id_lote', 'numero_lote', 'fecha_vencimiento', 'condicion'], include: [{ model: Laboratorio, attributes: ['nombre'] }] }]
                }
            ]
        },
        { model: SeguimientoPedido, include: [{ model: Usuario, attributes: ['nombre', 'apellido'] }] }
    ],
    order: [[SeguimientoPedido, 'fecha', 'ASC'], [DetallePedido, 'id_detalle_pedido', 'ASC']],
    transaction
});

// Quién registró la devolución y de qué lote regresó cada cantidad
const INCLUDE_DEVOLUCION = [
    { model: Usuario, attributes: ['nombre', 'apellido'] },
    {
        model: DetalleDevolucion,
        include: [
            { model: Lote, attributes: ['id_lote', 'numero_lote', 'fecha_vencimiento', 'condicion'] },
            { model: DetallePedido, attributes: ['id_detalle_pedido', 'precio_unitario'], include: [{ model: Producto, attributes: ['nombre', 'concentracion'] }] }
        ]
    }
];

const getPedido = async (req, res) => {
    try {
        const pedido = await cargarPedido(req.params.id);
        if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        const [devoluciones, diasAlerta] = await Promise.all([
            DevolucionPedido.findAll({
                where: { id_pedido: pedido.id_pedido },
                include: INCLUDE_DEVOLUCION,
                order: [['fecha_devolucion', 'DESC'], ['id_devolucion', 'DESC']]
            }),
            obtenerParametro('DIAS_ALERTA_PEDIDO')
        ]);
        const devuelto = devoluciones.filter(d => d.estado === 'registrada').reduce((s, d) => s + Number(d.unidades), 0);
        res.json({ ...conRetraso(pedido, diasAlerta, devuelto), devoluciones, causas_devolucion: CAUSAS_DEVOLUCION });
    } catch (error) { manejarError(res, error, 'Error al obtener pedido'); }
};

const registrarSeguimiento = (pedido, estado, req, observacion, transaction) =>
    SeguimientoPedido.create({ id_pedido: pedido.id_pedido, estado, id_usuario: req.usuario.id, observacion: observacion || null, fecha: new Date() }, { transaction });

// Unidades ya comprometidas en pedidos pendientes (todavía no descuentan
// inventario, pero esa existencia ya está prometida): { id_producto: cantidad }
const comprometidoEnPendientes = async (ids_producto, transaction, excluirPedido = null) => {
    const detalles = await DetallePedido.findAll({
        where: { id_producto: ids_producto },
        attributes: ['id_producto', 'cantidad'],
        include: [{
            model: Pedido, attributes: ['numero_pedido'],
            where: { estado: 'pendiente', ...(excluirPedido ? { id_pedido: { [Op.ne]: excluirPedido } } : {}) }
        }],
        transaction
    });
    const mapa = {};
    detalles.forEach(d => {
        const m = mapa[d.id_producto] || (mapa[d.id_producto] = { cantidad: 0, pedidos: new Set() });
        m.cantidad = redondear(m.cantidad + Number(d.cantidad));
        if (Number(d.cantidad) > 0) m.pedidos.add(d.Pedido.numero_pedido);
    });
    return mapa;
};

// Cuánto se puede pedir hoy de cada producto para un contrato: existencia
// apta (con la vida útil que exige el contrato) menos lo que ya está
// comprometido en otros pedidos pendientes.
const disponibilidadContrato = async (contrato, transaction) => {
    const ids = contrato.DetalleContratos.map(r => r.id_producto);
    const vigencia = await vigenciaDelContrato(contrato);
    const [apta, comprometido] = await Promise.all([
        existenciaApta({ ids_producto: ids, vigenciaMinimaMeses: vigencia, transaction }),
        comprometidoEnPendientes(ids, transaction)
    ]);
    const porProducto = {};
    ids.forEach(id => {
        const a = apta[id] || 0;
        const c = comprometido[id] || { cantidad: 0, pedidos: new Set() };
        porProducto[id] = { apta: a, comprometida: c.cantidad, pedidos: [...c.pedidos], disponible: Math.max(0, redondear(a - c.cantidad)) };
    });
    return { vigencia, porProducto };
};

// GET /pedidos/disponibilidad?id_contrato= -> existencia para pedir por
// renglón y la fecha de entrega que corresponde al plazo de la modalidad
const getDisponibilidad = async (req, res) => {
    try {
        const contrato = await Contrato.findByPk(req.query.id_contrato, {
            include: [DetalleContrato, { model: ModalidadCompra, attributes: ATRIBUTOS_MODALIDAD }]
        });
        if (!contrato) return res.status(404).json({ mensaje: 'Contrato no encontrado' });
        const [{ vigencia, porProducto }, diasPorDefecto, notas] = await Promise.all([
            disponibilidadContrato(contrato),
            obtenerParametro('DIAS_HABILES_ENTREGA'),
            // Notas técnicas vigentes: mientras duran, la institución compra ese renglón por otra modalidad
            TramiteContrato.findAll({
                where: { id_contrato: contrato.id_contrato, tipo: 'nota_tecnica', estado: 'aprobada', fecha_desde: { [Op.lte]: hoy() }, fecha_hasta: { [Op.gte]: hoy() } },
                attributes: ['id_detalle_contrato', 'fecha_hasta', 'numero_documento']
            })
        ]);
        const plazo = plazoEntrega(contrato.ModalidadCompra, diasPorDefecto);
        const sugerida = sumarDiasHabiles(hoy(), plazo);
        res.json({
            vigencia_minima_meses: vigencia,
            plazo_entrega_dias: plazo,
            fecha_sugerida: sugerida > contrato.fecha_fin ? contrato.fecha_fin : sugerida,
            fecha_fin: contrato.fecha_fin,
            modalidad: contrato.ModalidadCompra?.nombre,
            renglones: contrato.DetalleContratos.filter(r => r.activo).map(r => {
                const nota = notas.find(n => n.id_detalle_contrato === r.id_detalle_contrato);
                return { id_detalle_contrato: r.id_detalle_contrato, ...porProducto[r.id_producto], nota_tecnica: nota ? { numero: nota.numero_documento, hasta: nota.fecha_hasta } : null };
            })
        });
    } catch (error) { manejarError(res, error, 'Error al calcular la existencia disponible'); }
};

// Body: { id_contrato, fecha_programada, observaciones, detalles: [{ id_detalle_contrato, cantidad }] }
const createPedido = async (req, res) => {
    try {
        const { id_contrato, fecha_programada, observaciones, detalles } = req.body;
        const fechaHoy = hoy();
        if (!esFechaValida(fecha_programada) || fecha_programada < fechaHoy) throw new ErrorNegocio('La fecha programada de entrega es obligatoria y no puede ser pasada.');
        if (!Array.isArray(detalles) || detalles.filter(d => Number(d.cantidad) > 0).length === 0) {
            throw new ErrorNegocio('Indica la cantidad de al menos un renglón del contrato.');
        }

        let advertencia = null;
        const pedido = await sequelize.transaction(async (transaction) => {
            const contrato = await Contrato.findByPk(id_contrato, {
                include: [{ model: DetalleContrato, include: [{ model: Producto, attributes: ['nombre'] }] }, { model: ModalidadCompra, attributes: ATRIBUTOS_MODALIDAD }],
                transaction, lock: { level: transaction.LOCK.UPDATE, of: Contrato }
            });
            if (!contrato) throw new ErrorNegocio('Contrato no encontrado.', 404);
            if (contrato.estado !== 'vigente') throw new ErrorNegocio(`El contrato está ${contrato.estado}; solo se pueden hacer pedidos de contratos vigentes.`);
            if (fechaHoy < contrato.fecha_inicio) throw new ErrorNegocio('El contrato todavía no ha iniciado.');
            // Con el contrato vencido no hay presupuesto para pagar la entrega
            if (fecha_programada > contrato.fecha_fin) throw new ErrorNegocio(`La fecha programada no puede ser posterior al fin del contrato (${formatoGT(contrato.fecha_fin)}): después de esa fecha no se pueden hacer entregas.`);

            const avance = await calcularAvance(contrato.DetalleContratos.map(r => r.id_detalle_contrato), transaction);
            const { vigencia, porProducto } = await disponibilidadContrato(contrato, transaction);
            const lineas = [];
            for (const d of detalles.filter(x => Number(x.cantidad) > 0)) {
                const renglon = contrato.DetalleContratos.find(r => String(r.id_detalle_contrato) === String(d.id_detalle_contrato) && r.activo);
                if (!renglon) throw new ErrorNegocio('Uno de los renglones no pertenece a este contrato.');
                const cantidad = exigirCantidad(d.cantidad);
                const saldo = redondear(Number(renglon.cantidad_contratada) - (avance[renglon.id_detalle_contrato]?.pedida || 0));
                if (cantidad > saldo) {
                    throw new ErrorNegocio(`Renglón ${renglon.numero_renglon} (${renglon.Producto.nombre}): el saldo por pedir es ${saldo}, no se pueden pedir ${cantidad}.`);
                }
                // No se promete lo que no hay en bodega
                const disp = porProducto[renglon.id_producto];
                if (cantidad > disp.disponible) {
                    const otros = disp.comprometida > 0 ? `, de las que ${disp.comprometida} ya están comprometidas en pedidos pendientes (${disp.pedidos.join(', ')})` : '';
                    throw new ErrorNegocio(
                        `Renglón ${renglon.numero_renglon} (${renglon.Producto.nombre}): hay ${disp.apta} unidades aptas con al menos ${vigencia} meses de vida útil${otros}. Se pueden pedir hasta ${disp.disponible}, no ${cantidad}.`,
                        409
                    );
                }
                lineas.push({ renglon, cantidad });
            }

            // Plazo de la modalidad (baja cuantía y compra directa: 1 a 3 días hábiles o anulan la orden)
            const plazo = plazoEntrega(contrato.ModalidadCompra, await obtenerParametro('DIAS_HABILES_ENTREGA'));
            const limite = sumarDiasHabiles(fechaHoy, plazo);
            if (fecha_programada > limite) {
                advertencia = `La entrega programada supera el plazo de ${plazo} días hábiles de ${contrato.ModalidadCompra?.nombre || 'la modalidad'} (a más tardar el ${formatoGT(limite)}). Confirma la fecha con la institución${contrato.ModalidadCompra?.contrato_abierto ? '' : ': puede anular la orden y adjudicarla a otro proveedor'}.`;
            }

            const ultimo = await Pedido.max('id_pedido', { transaction }) || 0;
            const numero = `PED-${fechaHoy.slice(0, 4)}-${String(ultimo + 1).padStart(5, '0')}`;
            const nuevo = await Pedido.create({
                id_contrato, id_usuario: req.usuario.id, numero_pedido: numero, fecha_pedido: fechaHoy,
                fecha_programada, observaciones: observaciones || null, estado: 'pendiente',
                monto_total: redondear(lineas.reduce((s, l) => s + l.cantidad * Number(l.renglon.precio_unitario), 0))
            }, { transaction });
            for (const l of lineas) {
                await DetallePedido.create({
                    id_pedido: nuevo.id_pedido,
                    id_detalle_contrato: l.renglon.id_detalle_contrato,
                    id_producto: l.renglon.id_producto,
                    cantidad: l.cantidad,
                    precio_unitario: l.renglon.precio_unitario,
                    subtotal: redondear(l.cantidad * Number(l.renglon.precio_unitario))
                }, { transaction });
            }
            await registrarSeguimiento(nuevo, 'pendiente', req, 'Pedido registrado', transaction);
            await registrarAuditoria({ req, tabla: 'pedidos', id_registro: nuevo.id_pedido, accion: 'crear', despues: await cargarPedido(nuevo.id_pedido, transaction), transaction });
            return nuevo;
        });
        res.status(201).json({ mensaje: `Pedido ${pedido.numero_pedido} creado`, pedido, advertencia });
    } catch (error) { manejarError(res, error, 'Error al crear pedido'); }
};

// Solo mientras está pendiente: fecha programada y observaciones
const updatePedido = async (req, res) => {
    try {
        const pedido = await Pedido.findByPk(req.params.id, { include: [INCLUDE_CONTRATO] });
        if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        if (pedido.estado !== 'pendiente') throw new ErrorNegocio('Solo se puede editar un pedido pendiente.');
        const datos = {};
        if (req.body.fecha_programada !== undefined) {
            if (!esFechaValida(req.body.fecha_programada)) throw new ErrorNegocio('Fecha programada no válida.');
            if (req.body.fecha_programada > pedido.Contrato.fecha_fin) throw new ErrorNegocio('La fecha programada no puede ser posterior al fin del contrato.');
            datos.fecha_programada = req.body.fecha_programada;
        }
        if (req.body.observaciones !== undefined) datos.observaciones = req.body.observaciones;
        const motivo = datos.fecha_programada && datos.fecha_programada !== pedido.fecha_programada
            ? exigirTexto(req.body.motivo, 'Indica el motivo del cambio de fecha programada.')
            : req.body.motivo;
        const antes = instantanea(pedido);
        await pedido.update(datos);
        await registrarAuditoria({ req, tabla: 'pedidos', id_registro: pedido.id_pedido, accion: 'editar', antes, despues: pedido, motivo });
        res.json({ mensaje: 'Pedido actualizado', pedido });
    } catch (error) { manejarError(res, error, 'Error al actualizar pedido'); }
};

// Vista previa de los lotes que el sistema tomaría (FEFO), sin descontar nada
const getPropuestaFEFO = async (req, res) => {
    try {
        const pedido = await cargarPedido(req.params.id);
        if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        const vigencia = await vigenciaDelContrato(pedido.Contrato);
        const lineas = [];
        for (const d of pedido.DetallePedidos) {
            const propuesta = await proponerFEFO({ id_producto: d.id_producto, cantidad: d.cantidad, vigenciaMinimaMeses: vigencia });
            lineas.push({
                id_detalle_pedido: d.id_detalle_pedido,
                producto: d.Producto.nombre,
                codigo: d.Producto.codigo,
                cantidad: Number(d.cantidad),
                asignaciones: propuesta.asignaciones.map(({ lote, ...a }) => a),
                faltante: propuesta.faltante,
                excluidos: propuesta.excluidos
            });
        }
        res.json({ vigencia_minima_meses: vigencia, completo: lineas.every(l => l.faltante === 0), lineas });
    } catch (error) { manejarError(res, error, 'Error al calcular la propuesta de despacho'); }
};

// Confirma la preparación: asigna lotes por FEFO y descuenta el inventario.
// Si no alcanza la existencia apta para algún producto no se despacha nada.
const prepararPedido = async (req, res) => {
    try {
        await sequelize.transaction(async (transaction) => {
            const pedido = await Pedido.findByPk(req.params.id, {
                include: [INCLUDE_CONTRATO, { model: DetallePedido, include: [{ model: Producto, attributes: ['nombre'] }] }],
                transaction, lock: { level: transaction.LOCK.UPDATE, of: Pedido }
            });
            if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
            if (pedido.estado !== 'pendiente') throw new ErrorNegocio('Solo se puede preparar un pedido pendiente.');
            if (pedido.Contrato.estado !== 'vigente') throw new ErrorNegocio(`El contrato está ${pedido.Contrato.estado}; no se puede despachar.`);

            const vigencia = await vigenciaDelContrato(pedido.Contrato);
            const motivo = await obtenerMotivo('DESPACHO', transaction);
            const faltantes = [];
            const planes = [];
            for (const d of pedido.DetallePedidos) {
                const plan = await proponerFEFO({ id_producto: d.id_producto, cantidad: d.cantidad, vigenciaMinimaMeses: vigencia, transaction, bloquear: true });
                if (plan.faltante > 0) faltantes.push(`${d.Producto.nombre}: faltan ${plan.faltante} con al menos ${vigencia} meses de vida útil`);
                planes.push({ detalle: d, plan });
            }
            if (faltantes.length) throw new ErrorNegocio('No hay existencia apta suficiente para despachar el pedido completo.', 409, faltantes);

            for (const { detalle, plan } of planes) {
                for (const a of plan.asignaciones) {
                    await AsignacionLote.create({ id_detalle_pedido: detalle.id_detalle_pedido, id_lote: a.id_lote, cantidad: a.cantidad }, { transaction });
                    await registrarMovimiento({
                        lote: a.lote, tipo: 'salida', cantidad: a.cantidad, motivo, id_usuario: req.usuario.id,
                        id_pedido: pedido.id_pedido,
                        observacion: `${pedido.numero_pedido} · ${pedido.Contrato.Institucion.nombre} · Contrato ${pedido.Contrato.numero_contrato}`,
                        transaction
                    });
                }
            }
            const antes = instantanea(pedido);
            await pedido.update({ estado: 'en_preparacion' }, { transaction });
            await registrarSeguimiento(pedido, 'en_preparacion', req, req.body?.observacion || 'Lotes asignados por FEFO', transaction);
            await registrarAuditoria({ req, tabla: 'pedidos', id_registro: pedido.id_pedido, accion: 'cambio_estado', antes, despues: pedido, motivo: 'Preparación del despacho (FEFO)', transaction });
        });
        res.json({ mensaje: 'Pedido en preparación. Los lotes se asignaron automáticamente por fecha de vencimiento.' });
    } catch (error) { manejarError(res, error, 'Error al preparar el pedido'); }
};

// en_preparacion -> empacado -> en_transporte -> entregado
const avanzarPedido = async (req, res) => {
    try {
        let mensaje;
        await sequelize.transaction(async (transaction) => {
            const pedido = await Pedido.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
            if (pedido.estado === 'pendiente') throw new ErrorNegocio('Primero prepara el pedido para asignar los lotes.');
            const siguiente = Pedido.SIGUIENTE_ESTADO[pedido.estado];
            if (!siguiente) throw new ErrorNegocio(`Un pedido ${ETIQUETAS[pedido.estado].toLowerCase()} no puede avanzar.`);
            // El encargado de contratos confirma la entrega con la institución; el empaque y el envío son de bodega
            if (req.usuario.rol === 'encargado_contratos' && siguiente !== 'entregado') {
                throw new ErrorNegocio('Bodega es quien marca el pedido como empacado o en transporte.', 403);
            }

            const cambios = { estado: siguiente };
            if (siguiente === 'entregado') {
                const fecha = req.body?.fecha_entrega || hoy();
                if (!esFechaValida(fecha) || fecha > hoy() || fecha < pedido.fecha_pedido) {
                    throw new ErrorNegocio('La fecha de entrega no puede ser futura ni anterior a la fecha del pedido.');
                }
                cambios.fecha_real_entrega = fecha;
            }
            const antes = instantanea(pedido);
            await pedido.update(cambios, { transaction });
            await registrarSeguimiento(pedido, siguiente, req, req.body?.observacion, transaction);
            await registrarAuditoria({ req, tabla: 'pedidos', id_registro: pedido.id_pedido, accion: 'cambio_estado', antes, despues: pedido, motivo: req.body?.observacion, transaction });
            if (siguiente === 'entregado') await verificarContratoCompletado(pedido.id_contrato, req, transaction);
            mensaje = `Pedido ${pedido.numero_pedido}: ${ETIQUETAS[siguiente]}`;
        });
        res.json({ mensaje });
    } catch (error) { manejarError(res, error, 'Error al actualizar el estado del pedido'); }
};

// Caso 4, "si falta mercadería": reduce cada renglón del pedido pendiente a
// la existencia apta para el contrato. Lo que no se despacha vuelve al saldo
// del contrato y se puede pedir después. Nunca se descuenta lo que no existe.
const ajustarPedido = async (req, res) => {
    try {
        const motivo = exigirTexto(req.body?.motivo, 'Indica el motivo del ajuste (por ejemplo, la institución acepta una entrega parcial).');
        let mensaje;
        await sequelize.transaction(async (transaction) => {
            const pedido = await Pedido.findByPk(req.params.id, {
                include: [INCLUDE_CONTRATO, { model: DetallePedido, include: [{ model: Producto, attributes: ['nombre'] }] }],
                transaction, lock: { level: transaction.LOCK.UPDATE, of: Pedido }
            });
            if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
            if (pedido.estado !== 'pendiente') throw new ErrorNegocio('Solo se puede ajustar un pedido pendiente.');
            const antes = await cargarPedido(pedido.id_pedido, transaction);
            const vigencia = await vigenciaDelContrato(pedido.Contrato);

            const cambios = [];
            for (const d of pedido.DetallePedidos) {
                const { faltante } = await proponerFEFO({ id_producto: d.id_producto, cantidad: d.cantidad, vigenciaMinimaMeses: vigencia, transaction });
                if (faltante > 0) cambios.push({ d, apta: redondear(Number(d.cantidad) - faltante), faltante });
            }
            if (!cambios.length) throw new ErrorNegocio('El pedido ya está cubierto con la existencia apta; no hace falta ajustarlo.');
            const quedaAlgo = pedido.DetallePedidos.some(d => {
                const cambio = cambios.find(x => x.d === d);
                return cambio ? cambio.apta > 0 : Number(d.cantidad) > 0;
            });
            if (!quedaAlgo) throw new ErrorNegocio('No hay existencia apta de ningún producto del pedido. Espera un ingreso de compra o anula el pedido.');

            // El renglón sin existencia apta queda en cero (no se borra) para que se vea qué se pidió
            for (const { d, apta } of cambios) {
                await d.update({ cantidad: apta, subtotal: redondear(apta * Number(d.precio_unitario)) }, { transaction });
            }
            const monto = redondear(pedido.DetallePedidos.reduce((s, d) => s + Number(d.subtotal), 0));
            await pedido.update({ monto_total: monto }, { transaction });
            const detalle = cambios.map(x => `${x.d.Producto.nombre}: -${x.faltante}`).join('; ');
            await registrarSeguimiento(pedido, 'pendiente', req, `Ajustado a existencia apta (${detalle}). ${motivo}`, transaction);
            await registrarAuditoria({ req, tabla: 'pedidos', id_registro: pedido.id_pedido, accion: 'editar', antes, despues: await cargarPedido(pedido.id_pedido, transaction), motivo: `Ajuste a existencia apta: ${motivo}`, transaction });
            mensaje = `Pedido ajustado (${detalle}). Lo que no se despacha regresó al saldo del contrato.`;
        });
        res.json({ mensaje });
    } catch (error) { manejarError(res, error, 'Error al ajustar el pedido'); }
};

// Anula el pedido; si ya tenía lotes asignados, la existencia regresa a esos lotes
const anularPedido = async (req, res) => {
    try {
        const motivoTexto = exigirTexto(req.body?.motivo, 'Indica el motivo de la anulación.');
        await sequelize.transaction(async (transaction) => {
            const pedido = await Pedido.findByPk(req.params.id, {
                include: [{ model: DetallePedido, include: [AsignacionLote] }],
                transaction, lock: { level: transaction.LOCK.UPDATE, of: Pedido }
            });
            if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
            if (['entregado', 'anulado'].includes(pedido.estado)) throw new ErrorNegocio(`Un pedido ${pedido.estado} no se puede anular.`);

            const asignaciones = pedido.DetallePedidos.flatMap(d => d.AsignacionLotes);
            if (asignaciones.length) {
                const motivo = await obtenerMotivo('ANULACION_PEDIDO', transaction);
                for (const a of asignaciones) {
                    const lote = await Lote.findByPk(a.id_lote, { transaction, lock: transaction.LOCK.UPDATE });
                    await registrarMovimiento({
                        lote, tipo: 'entrada', cantidad: a.cantidad, motivo, id_usuario: req.usuario.id,
                        id_pedido: pedido.id_pedido, observacion: `${pedido.numero_pedido}: ${motivoTexto}`, transaction
                    });
                }
            }
            const antes = instantanea(pedido);
            await pedido.update({ estado: 'anulado' }, { transaction });
            await registrarSeguimiento(pedido, 'anulado', req, motivoTexto, transaction);
            await registrarAuditoria({ req, tabla: 'pedidos', id_registro: pedido.id_pedido, accion: 'anular', antes, despues: pedido, motivo: motivoTexto, transaction });
        });
        res.json({ mensaje: 'Pedido anulado. Si tenía lotes asignados, la existencia regresó al inventario.' });
    } catch (error) { manejarError(res, error, 'Error al anular el pedido'); }
};

// Carta de compromiso de entrega: el proveedor indica por escrito cuánto
// tiempo necesita. Debe presentarse antes de que el pedido se atrase y no
// puede pasar del fin del contrato (después no hay presupuesto para pagar).
// Body: { fecha_compromiso, documento, motivo }
const registrarCompromiso = async (req, res) => {
    try {
        const { fecha_compromiso } = req.body;
        const documento = exigirTexto(req.body.documento, 'Indica el número o la referencia de la carta de compromiso.');
        const motivo = exigirTexto(req.body.motivo, 'Indica por qué se necesita más tiempo para entregar.');
        let mensaje;
        await sequelize.transaction(async (transaction) => {
            const pedido = await Pedido.findByPk(req.params.id, { include: [INCLUDE_CONTRATO], transaction, lock: { level: transaction.LOCK.UPDATE, of: Pedido } });
            if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
            if (['entregado', 'anulado'].includes(pedido.estado)) throw new ErrorNegocio(`Un pedido ${pedido.estado} no necesita carta de compromiso.`);
            const limiteActual = fechaLimite(pedido);
            if (hoy() > limiteActual) {
                throw new ErrorNegocio(`El pedido ya está atrasado desde el ${formatoGT(limiteActual)}. La carta de compromiso se presenta antes de la fecha de entrega; el atraso ya cuenta.`);
            }
            if (!esFechaValida(fecha_compromiso) || fecha_compromiso <= limiteActual) {
                throw new ErrorNegocio(`La nueva fecha de entrega debe ser posterior a la actual (${formatoGT(limiteActual)}).`);
            }
            if (fecha_compromiso > pedido.Contrato.fecha_fin) {
                throw new ErrorNegocio(`No se puede comprometer la entrega después del fin del contrato (${formatoGT(pedido.Contrato.fecha_fin)}). Si hace falta más tiempo, solicita una prórroga del contrato.`);
            }
            const antes = instantanea(pedido);
            await pedido.update({ fecha_compromiso, documento_compromiso: documento.slice(0, 100) }, { transaction });
            await registrarAuditoria({ req, tabla: 'pedidos', id_registro: pedido.id_pedido, accion: 'editar', antes, despues: pedido, motivo: `Carta de compromiso ${documento}: entrega al ${formatoGT(fecha_compromiso)}. ${motivo}`, transaction });
            mensaje = `Carta de compromiso registrada. El retraso se contará desde el día hábil siguiente al ${formatoGT(fecha_compromiso)}.`;
        });
        res.json({ mensaje });
    } catch (error) { manejarError(res, error, 'Error al registrar la carta de compromiso'); }
};

// Cantidad ya devuelta (devoluciones vigentes) de cada asignación de lote
const devueltoPorAsignacion = async (ids, transaction) => {
    const mapa = {};
    if (!ids.length) return mapa;
    const detalles = await DetalleDevolucion.findAll({
        where: { id_asignacion: ids },
        include: [{ model: DevolucionPedido, attributes: [], where: { estado: 'registrada' } }],
        transaction
    });
    detalles.forEach(d => { mapa[d.id_asignacion] = redondear((mapa[d.id_asignacion] || 0) + Number(d.cantidad)); });
    return mapa;
};

// La institución devuelve producto de un pedido entregado. El producto
// regresa al mismo lote del que salió (kárdex ligado al pedido) y la cantidad
// vuelve al saldo del contrato para que se pueda reponer.
// Body: { fecha_devolucion, causa, descripcion, documento, cuarentena, lineas: [{ id_asignacion, cantidad }] }
const registrarDevolucion = async (req, res) => {
    try {
        const { causa, documento, cuarentena } = req.body;
        const fecha = req.body.fecha_devolucion || hoy();
        if (!CAUSAS_DEVOLUCION[causa]) throw new ErrorNegocio('Selecciona la causa de la devolución.');
        const descripcion = exigirTexto(req.body.descripcion, 'Describe qué devolvió la institución y por qué.');
        if (!esFechaValida(fecha) || fecha > hoy()) throw new ErrorNegocio('La fecha de la devolución no puede ser futura.');
        const lineas = (Array.isArray(req.body.lineas) ? req.body.lineas : []).filter(l => Number(l.cantidad) > 0);
        if (!lineas.length) throw new ErrorNegocio('Indica cuánto se devolvió de al menos un lote.');

        let mensaje;
        await sequelize.transaction(async (transaction) => {
            const pedido = await Pedido.findByPk(req.params.id, {
                include: [INCLUDE_CONTRATO, { model: DetallePedido, include: [AsignacionLote, { model: Producto, attributes: ['nombre'] }] }],
                transaction, lock: { level: transaction.LOCK.UPDATE, of: Pedido }
            });
            if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);
            if (pedido.estado !== 'entregado') throw new ErrorNegocio('Solo se registran devoluciones de pedidos entregados. Si el pedido todavía no llega a la institución, anúlalo.');
            if (fecha < pedido.fecha_real_entrega) throw new ErrorNegocio(`La devolución no puede ser anterior a la entrega (${formatoGT(pedido.fecha_real_entrega)}).`);

            const asignaciones = pedido.DetallePedidos.flatMap(d => d.AsignacionLotes.map(a => ({ a, d })));
            const yaDevuelto = await devueltoPorAsignacion(asignaciones.map(x => x.a.id_asignacion), transaction);
            const motivo = await obtenerMotivo('DEVOLUCION_CLIENTE', transaction);
            const devolucion = await DevolucionPedido.create({
                id_pedido: pedido.id_pedido, id_usuario: req.usuario.id, fecha_devolucion: fecha, causa, descripcion,
                documento: documento ? String(documento).trim().slice(0, 100) || null : null, unidades: 0, monto: 0, estado: 'registrada'
            }, { transaction });

            let unidades = 0, monto = 0;
            const aCuarentena = [];
            for (const l of lineas) {
                const item = asignaciones.find(x => String(x.a.id_asignacion) === String(l.id_asignacion));
                if (!item) throw new ErrorNegocio('Uno de los lotes no pertenece a este pedido.');
                const cantidad = exigirCantidad(l.cantidad);
                const lote = await Lote.findByPk(item.a.id_lote, { transaction, lock: transaction.LOCK.UPDATE });
                const maximo = redondear(Number(item.a.cantidad) - (yaDevuelto[item.a.id_asignacion] || 0));
                if (cantidad > maximo) {
                    throw new ErrorNegocio(`Lote ${lote.numero_lote} (${item.d.Producto.nombre}): se entregaron ${Number(item.a.cantidad)}${yaDevuelto[item.a.id_asignacion] ? ` y ya se devolvieron ${yaDevuelto[item.a.id_asignacion]}` : ''}; se pueden devolver hasta ${maximo}.`);
                }
                if (lote.condicion === 'anulado') throw new ErrorNegocio(`El lote ${lote.numero_lote} está anulado; no puede recibir la devolución.`);
                const antesLote = instantanea(lote);
                await registrarMovimiento({
                    lote, tipo: 'entrada', cantidad, motivo, id_usuario: req.usuario.id, id_pedido: pedido.id_pedido,
                    observacion: `${pedido.numero_pedido} · ${pedido.Contrato.Institucion.nombre}: ${CAUSAS_DEVOLUCION[causa]}. ${descripcion}`,
                    transaction
                });
                // Lo devuelto no se vuelve a despachar sin revisión: vencido si ya pasó su fecha, o en cuarentena si se pidió
                let nueva = null;
                if (lote.fecha_vencimiento < hoy() && lote.condicion !== 'vencido') nueva = { condicion: 'vencido', motivo_condicion: 'Vencimiento automático por fecha' };
                else if (cuarentena && lote.condicion === 'disponible') nueva = { condicion: 'cuarentena', motivo_condicion: `Producto devuelto en ${pedido.numero_pedido}: revisar antes de despachar` };
                if (nueva) {
                    await lote.update(nueva, { transaction });
                    await registrarAuditoria({ req, tabla: 'lotes', id_registro: lote.id_lote, accion: 'cambio_estado', antes: antesLote, despues: lote, motivo: nueva.motivo_condicion, transaction });
                    if (nueva.condicion === 'cuarentena') aCuarentena.push(lote.numero_lote);
                }
                await DetalleDevolucion.create({
                    id_devolucion: devolucion.id_devolucion, id_asignacion: item.a.id_asignacion,
                    id_detalle_pedido: item.d.id_detalle_pedido, id_lote: lote.id_lote, cantidad
                }, { transaction });
                yaDevuelto[item.a.id_asignacion] = redondear((yaDevuelto[item.a.id_asignacion] || 0) + cantidad);
                unidades += cantidad;
                monto += cantidad * Number(item.d.precio_unitario);
            }
            await devolucion.update({ unidades: redondear(unidades), monto: redondear(monto) }, { transaction });
            await registrarAuditoria({
                req, tabla: 'devoluciones_pedido', id_registro: devolucion.id_devolucion, accion: 'crear',
                despues: await DevolucionPedido.findByPk(devolucion.id_devolucion, { include: [DetalleDevolucion], transaction }),
                motivo: `Devolución de ${pedido.numero_pedido}: ${CAUSAS_DEVOLUCION[causa]}`, transaction
            });
            await reabrirContrato(pedido.id_contrato, req, `Devolución de ${pedido.numero_pedido}: el contrato vuelve a tener saldo`, transaction);
            mensaje = `Devolución registrada: ${redondear(unidades)} unidades regresaron a sus lotes y al saldo del contrato.${aCuarentena.length ? ` Lotes en cuarentena para revisión: ${aCuarentena.join(', ')}.` : ''}`;
        });
        res.status(201).json({ mensaje });
    } catch (error) { manejarError(res, error, 'Error al registrar la devolución'); }
};

// Anula una devolución registrada por error: el producto vuelve a salir de
// los lotes y la cantidad cuenta otra vez como entregada.
const anularDevolucion = async (req, res) => {
    try {
        const motivoTexto = exigirTexto(req.body?.motivo, 'Indica el motivo de la anulación.');
        let mensaje;
        await sequelize.transaction(async (transaction) => {
            const devolucion = await DevolucionPedido.findByPk(req.params.id, {
                include: [DetalleDevolucion, { model: Pedido, attributes: ['id_pedido', 'numero_pedido', 'id_contrato'] }],
                transaction, lock: { level: transaction.LOCK.UPDATE, of: DevolucionPedido }
            });
            if (!devolucion) throw new ErrorNegocio('Devolución no encontrada', 404);
            if (devolucion.estado === 'anulada') throw new ErrorNegocio('La devolución ya está anulada.');
            const antes = instantanea(devolucion);
            const motivo = await obtenerMotivo('ANULACION_DEVOLUCION', transaction);
            const retenidos = [];
            for (const d of devolucion.DetalleDevolucions) {
                const lote = await Lote.findByPk(d.id_lote, { transaction, lock: transaction.LOCK.UPDATE });
                if (Number(lote.cantidad_disponible) < Number(d.cantidad)) {
                    throw new ErrorNegocio(`El lote ${lote.numero_lote} ya no tiene las ${Number(d.cantidad)} unidades devueltas (hay ${Number(lote.cantidad_disponible)}); no se puede anular la devolución.`);
                }
                await registrarMovimiento({
                    lote, tipo: 'salida', cantidad: d.cantidad, motivo, id_usuario: req.usuario.id, id_pedido: devolucion.id_pedido,
                    observacion: `${devolucion.Pedido.numero_pedido}: anulación de devolución. ${motivoTexto}`, transaction
                });
                if (lote.condicion === 'cuarentena') retenidos.push(lote.numero_lote);
            }
            await devolucion.update({ estado: 'anulada', motivo_anulacion: motivoTexto }, { transaction });
            await registrarAuditoria({ req, tabla: 'devoluciones_pedido', id_registro: devolucion.id_devolucion, accion: 'anular', antes, despues: devolucion, motivo: motivoTexto, transaction });
            await verificarContratoCompletado(devolucion.Pedido.id_contrato, req, transaction);
            mensaje = `Devolución anulada: el producto vuelve a contar como entregado.${retenidos.length ? ` Los lotes ${[...new Set(retenidos)].join(', ')} siguen en cuarentena; libéralos desde Lotes si corresponde.` : ''}`;
        });
        res.json({ mensaje });
    } catch (error) { manejarError(res, error, 'Error al anular la devolución'); }
};

module.exports = {
    getPedidos, getPedido, getDisponibilidad, createPedido, updatePedido, getPropuestaFEFO, prepararPedido,
    avanzarPedido, ajustarPedido, anularPedido, registrarCompromiso, registrarDevolucion, anularDevolucion,
    devueltoPorPedido, calcularRetraso, ETIQUETAS, CAUSAS_DEVOLUCION
};
