// Cálculos de seguimiento que usan a la vez el panel de control y los
// informes, para que ambos muestren siempre las mismas cifras.
const { Op } = require('sequelize');
const { Lote, Producto, Laboratorio, Ingreso, Proveedor, Ubicacion, Pedido, Contrato, Institucion, ModalidadCompra } = require('../models/index');
const { cargarConAvance } = require('../controllers/contratoController');
const { hoy, sumarMeses, sumarDias, diasEntre } = require('../utils/fechas');
const { redondear } = require('./inventario');

// Días de retraso: contra hoy si no se ha entregado, o contra la fecha real
const calcularRetraso = (p) => {
    if (p.estado === 'anulado') return 0;
    const referencia = p.estado === 'entregado' ? p.fecha_real_entrega : hoy();
    return referencia ? Math.max(0, diasEntre(p.fecha_programada, referencia)) : 0;
};

// Estados en los que el producto todavía no ha salido de la droguería
const SIN_DESPACHAR = ['pendiente', 'en_preparacion', 'empacado'];

// Alerta preventiva: pedidos que no han salido de bodega y cuya fecha
// programada llega en los próximos `dias` días (o ya llegó hoy).
const esEntregaProxima = (p, dias) => {
    if (!SIN_DESPACHAR.includes(p.estado)) return false;
    const faltan = diasEntre(hoy(), p.fecha_programada);
    return faltan >= 0 && faltan <= dias;
};

// ---------- Lotes por vencer sin destino (caso 4) ----------
// Lotes disponibles que ningún contrato vigente con saldo puede recibir,
// porque vencen antes de la vida útil mínima que exige cada contrato. Si el
// producto no está en ningún contrato, solo se reporta cuando ya entró en la
// alerta amarilla del semáforo (para no listar todo el inventario).
const lotesSinDestino = async (parametros) => {
    const fechaHoy = hoy();
    const [lotes, contratos] = await Promise.all([
        Lote.findAll({
            where: { condicion: 'disponible', cantidad_disponible: { [Op.gt]: 0 }, fecha_vencimiento: { [Op.gte]: fechaHoy } },
            include: [
                { model: Producto, attributes: ['id_producto', 'nombre', 'codigo', 'concentracion'] },
                { model: Laboratorio, attributes: ['nombre'] },
                { model: Ubicacion, attributes: ['nombre'] },
                { model: Ingreso, attributes: ['serie_factura', 'numero_factura'], include: [{ model: Proveedor, attributes: ['nombre'] }] }
            ],
            order: [['fecha_vencimiento', 'ASC']]
        }),
        cargarConAvance({ estado: 'vigente' })
    ]);

    // Por producto: qué contratos vigentes todavía pueden pedirlo y desde qué fecha de vencimiento lo aceptan
    const destinos = {};
    contratos.forEach(c => {
        const meses = c.vigencia_minima_meses ?? parametros.VIGENCIA_MINIMA_DESPACHO_MESES;
        c.renglones.filter(r => r.saldo_por_pedir > 0).forEach(r => {
            (destinos[r.id_producto] || (destinos[r.id_producto] = [])).push({
                numero_contrato: c.numero_contrato, meses, acepta_desde: sumarMeses(fechaHoy, meses)
            });
        });
    });

    return lotes.map(l => {
        const opciones = destinos[l.id_producto] || [];
        const dias = diasEntre(fechaHoy, l.fecha_vencimiento);
        if (opciones.some(o => l.fecha_vencimiento >= o.acepta_desde)) return null;
        if (!opciones.length && dias > parametros.DIAS_SEMAFORO_AMARILLO) return null;
        const razon = opciones.length
            ? `Vence antes de lo que exigen los contratos (${[...new Set(opciones.map(o => `${o.numero_contrato}: ${o.meses} meses`))].join(', ')})`
            : 'Ningún contrato vigente tiene saldo de este producto';
        return {
            id_lote: l.id_lote, id_producto: l.id_producto, numero_lote: l.numero_lote,
            producto: `${l.Producto.nombre} ${l.Producto.concentracion || ''}`.trim(),
            laboratorio: l.Laboratorio?.nombre, proveedor: l.Ingreso?.Proveedor?.nombre, ubicacion: l.Ubicacion?.nombre,
            fecha_vencimiento: l.fecha_vencimiento, dias,
            existencia: Number(l.cantidad_disponible),
            valor: redondear(Number(l.cantidad_disponible) * Number(l.costo_unitario)),
            razon
        };
    }).filter(Boolean);
};

// ---------- Indicadores de cumplimiento (objetivo específico 3) ----------
// Sobre los pedidos entregados en el período y los contratos cerrados:
//   tasa de entregas a tiempo, promedio de días de retraso y porcentaje de
//   contratos cerrados que se entregaron completos y sin ningún atraso.
const PEDIDO_CON_CONTRATO = {
    model: Contrato, attributes: ['id_contrato', 'numero_contrato', 'id_institucion', 'id_modalidad', 'estado'],
    include: [{ model: Institucion, attributes: ['nombre'] }, { model: ModalidadCompra, attributes: ['nombre'] }]
};

const resumirEntregas = (pedidos) => {
    const retrasos = pedidos.map(calcularRetraso);
    const conRetraso = retrasos.filter(d => d > 0);
    return {
        entregados: pedidos.length,
        a_tiempo: retrasos.length - conRetraso.length,
        con_retraso: conRetraso.length,
        tasa_a_tiempo: pedidos.length ? Math.round(((retrasos.length - conRetraso.length) / pedidos.length) * 100) : null,
        retraso_promedio: conRetraso.length ? redondear(conRetraso.reduce((s, d) => s + d, 0) / conRetraso.length) : 0
    };
};

// Un contrato cerrado se considera cumplido si se entregó todo lo adjudicado
// y ninguno de sus pedidos llegó tarde.
const evaluarContratosCerrados = async (filtro = {}) => {
    const cerrados = await cargarConAvance({ estado: { [Op.in]: ['completado', 'vencido', 'cancelado'] }, ...filtro });
    if (!cerrados.length) return [];
    const entregados = await Pedido.findAll({
        where: { id_contrato: cerrados.map(c => c.id_contrato), estado: 'entregado' },
        attributes: ['id_contrato', 'estado', 'fecha_programada', 'fecha_real_entrega']
    });
    return cerrados.map(c => {
        const propios = entregados.filter(p => p.id_contrato === c.id_contrato);
        const atrasados = propios.filter(p => calcularRetraso(p) > 0).length;
        return { ...c, pedidos_atrasados: atrasados, cumplido: !c.tiene_saldo && atrasados === 0 };
    });
};

const indicadoresCumplimiento = async ({ desde, hasta } = {}) => {
    const fin = hasta || hoy();
    const inicio = desde || sumarDias(fin, -365);
    const [pedidos, cerrados] = await Promise.all([
        Pedido.findAll({
            where: { estado: 'entregado', fecha_real_entrega: { [Op.between]: [inicio, fin] } },
            attributes: ['id_pedido', 'estado', 'fecha_programada', 'fecha_real_entrega']
        }),
        evaluarContratosCerrados()
    ]);
    const cumplidos = cerrados.filter(c => c.cumplido).length;
    return {
        desde: inicio, hasta: fin,
        ...resumirEntregas(pedidos),
        contratos_cerrados: cerrados.length,
        contratos_cumplidos: cumplidos,
        tasa_contratos_cumplidos: cerrados.length ? Math.round((cumplidos / cerrados.length) * 100) : null
    };
};

module.exports = {
    calcularRetraso, esEntregaProxima, SIN_DESPACHAR, lotesSinDestino,
    indicadoresCumplimiento, resumirEntregas, evaluarContratosCerrados, PEDIDO_CON_CONTRATO
};
