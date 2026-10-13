// Reglas de inventario. Toda entrada o salida de un lote pasa por aquí, para
// que el kárdex y la existencia del lote nunca se desajusten.
const { Op } = require('sequelize');
const { Lote, Movimiento, MotivoMovimiento, Laboratorio } = require('../models/index');
const { ErrorNegocio } = require('../utils/errores');
const { hoy, esFechaValida, sumarMeses, diasEntre, formatoGT } = require('../utils/fechas');

const redondear = (n) => Math.round(Number(n) * 100) / 100;

// ---------- Validación de fechas de un lote ----------
// vigenciaMinimaMeses solo se exige al ingresar el lote (al editarlo, todo
// lote baja con el tiempo por debajo del mínimo y eso no debe impedir
// corregir otros datos).
const validarFechasLote = ({ fecha_fabricacion, fecha_vencimiento }, { vigenciaMinimaMeses = null } = {}) => {
    if (!esFechaValida(fecha_fabricacion)) throw new ErrorNegocio('La fecha de fabricación es obligatoria y debe ser válida.');
    if (!esFechaValida(fecha_vencimiento)) throw new ErrorNegocio('La fecha de vencimiento es obligatoria y debe ser válida.');
    if (fecha_fabricacion > hoy()) throw new ErrorNegocio('La fecha de fabricación no puede ser una fecha futura.');
    if (fecha_vencimiento <= fecha_fabricacion) {
        throw new ErrorNegocio('La fecha de vencimiento debe ser posterior a la fecha de fabricación. Ningún producto puede vencer antes de fabricarse.');
    }
    if (vigenciaMinimaMeses !== null) {
        const minimo = sumarMeses(hoy(), vigenciaMinimaMeses);
        if (fecha_vencimiento < minimo) {
            throw new ErrorNegocio(`El lote debe tener al menos ${vigenciaMinimaMeses} meses de vida útil al ingresarlo (vencer el ${formatoGT(minimo)} o después).`);
        }
    }
};

const obtenerMotivo = async (codigo, transaction) => {
    const motivo = await MotivoMovimiento.findOne({ where: { codigo }, transaction });
    if (!motivo) throw new ErrorNegocio(`Falta el motivo de movimiento "${codigo}" en el catálogo.`, 500);
    return motivo;
};

// ---------- Movimiento de kárdex ----------
// Actualiza la existencia del lote y deja el movimiento con su saldo.
// El lote debe venir bloqueado (SELECT ... FOR UPDATE) dentro de la transacción.
const registrarMovimiento = async ({ lote, tipo, cantidad, motivo, id_usuario, observacion, id_ingreso, id_pedido, transaction }) => {
    const cant = redondear(cantidad);
    if (!(cant > 0)) throw new ErrorNegocio('La cantidad del movimiento debe ser mayor que cero.');
    if (motivo.tipo !== tipo) throw new ErrorNegocio(`El motivo "${motivo.nombre}" no corresponde a una ${tipo}.`);

    const saldo = redondear(Number(lote.cantidad_disponible) + (tipo === 'entrada' ? cant : -cant));
    if (saldo < 0) {
        throw new ErrorNegocio(`Existencia insuficiente en el lote ${lote.numero_lote}: hay ${Number(lote.cantidad_disponible)} y se intentan sacar ${cant}.`);
    }

    const cambios = { cantidad_disponible: saldo };
    if (saldo === 0 && lote.condicion === 'disponible') cambios.condicion = 'agotado';
    if (saldo > 0 && lote.condicion === 'agotado') cambios.condicion = 'disponible';
    await lote.update(cambios, { transaction });

    return Movimiento.create({
        id_lote: lote.id_lote,
        id_usuario,
        tipo_movimiento: tipo,
        id_motivo: motivo.id_motivo,
        cantidad: cant,
        saldo,
        observacion: observacion || null,
        id_ingreso: id_ingreso || null,
        id_pedido: id_pedido || null,
        fecha_movimiento: new Date()
    }, { transaction });
};

// ---------- FEFO: primero en vencer, primero en salir ----------
// Reparte la cantidad entre los lotes disponibles del producto, empezando por
// el que vence antes. Los lotes que no cumplen la vida útil mínima exigida se
// excluyen y se informan aparte. El usuario no elige el lote.
const proponerFEFO = async ({ id_producto, cantidad, vigenciaMinimaMeses, transaction, bloquear = false }) => {
    const fechaHoy = hoy();
    const fechaMinima = sumarMeses(fechaHoy, vigenciaMinimaMeses);

    const lotes = await Lote.findAll({
        where: {
            id_producto,
            condicion: 'disponible',
            cantidad_disponible: { [Op.gt]: 0 },
            fecha_vencimiento: { [Op.gt]: fechaHoy }
        },
        include: [{ model: Laboratorio, attributes: ['nombre'] }],
        order: [['fecha_vencimiento', 'ASC'], ['id_lote', 'ASC']],
        transaction,
        // Bloquea solo las filas de lotes (no la del laboratorio) hasta que termine el despacho
        ...(bloquear ? { lock: { level: transaction.LOCK.UPDATE, of: Lote } } : {})
    });

    let pendiente = redondear(cantidad);
    const asignaciones = [];
    const excluidos = [];

    for (const lote of lotes) {
        const datos = {
            id_lote: lote.id_lote,
            numero_lote: lote.numero_lote,
            laboratorio: lote.Laboratorio?.nombre,
            fecha_vencimiento: lote.fecha_vencimiento,
            dias_para_vencer: diasEntre(fechaHoy, lote.fecha_vencimiento),
            disponible: Number(lote.cantidad_disponible)
        };
        if (lote.fecha_vencimiento < fechaMinima) {
            excluidos.push({ ...datos, razon: `Vida útil menor a ${vigenciaMinimaMeses} meses` });
            continue;
        }
        if (pendiente <= 0) continue;
        const tomar = Math.min(pendiente, Number(lote.cantidad_disponible));
        asignaciones.push({ ...datos, cantidad: redondear(tomar), lote });
        pendiente = redondear(pendiente - tomar);
    }

    return { asignaciones, faltante: pendiente > 0 ? pendiente : 0, excluidos, fechaMinima };
};

// ---------- Semáforo de vencimiento ----------
const semaforo = (fecha_vencimiento, parametros) => {
    const dias = diasEntre(hoy(), fecha_vencimiento);
    if (dias < 0) return { dias, color: 'vencido' };
    if (dias <= parametros.DIAS_SEMAFORO_ROJO) return { dias, color: 'rojo' };
    if (dias <= parametros.DIAS_SEMAFORO_AMARILLO) return { dias, color: 'amarillo' };
    return { dias, color: 'verde' };
};

module.exports = { validarFechasLote, registrarMovimiento, proponerFEFO, obtenerMotivo, semaforo, redondear };
