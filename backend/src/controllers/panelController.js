// Panel de control: indicadores, alertas y actividad reciente
const { Op } = require('sequelize');
const { Producto, Lote, Contrato, Pedido, Ingreso, Institucion, Laboratorio } = require('../models/index');
const { manejarError } = require('../utils/errores');
const { obtenerParametros } = require('../services/parametros');
const { semaforo } = require('../services/inventario');
const { resumirLotes } = require('./productoController');
const { cargarConAvance } = require('./contratoController');
const { calcularRetraso, ETIQUETAS } = require('./pedidoController');
const { hoy } = require('../utils/fechas');

const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const getPanel = async (req, res) => {
    try {
        const par = await obtenerParametros();
        const fechaHoy = hoy();

        const [productos, lotes, contratos, pedidos, ingresos] = await Promise.all([
            Producto.findAll({ where: { activo: true }, include: [{ model: Lote, attributes: ['cantidad_disponible', 'condicion', 'fecha_vencimiento'] }] }),
            Lote.findAll({
                where: { cantidad_disponible: { [Op.gt]: 0 }, condicion: { [Op.in]: ['disponible', 'cuarentena', 'bloqueado', 'vencido'] } },
                include: [{ model: Producto, attributes: ['id_producto', 'nombre'] }, { model: Laboratorio, attributes: ['nombre'] }],
                order: [['fecha_vencimiento', 'ASC']]
            }),
            cargarConAvance({ estado: 'vigente' }),
            Pedido.findAll({
                include: [{ model: Contrato, attributes: ['numero_contrato'], include: [{ model: Institucion, attributes: ['nombre'] }] }],
                order: [['createdAt', 'DESC']]
            }),
            Ingreso.findAll({ where: { estado: 'registrado' }, attributes: ['fecha_recepcion'] })
        ]);

        const bajoMinimo = productos
            .map(p => ({ p, r: resumirLotes(p.Lotes, par) }))
            .filter(x => x.r.existencia < Number(x.p.stock_minimo || 0))
            .map(x => ({ id_producto: x.p.id_producto, nombre: x.p.nombre, existencia: x.r.existencia, stock_minimo: x.p.stock_minimo }));

        const alertasLotes = lotes
            .map(l => ({
                id_lote: l.id_lote, numero_lote: l.numero_lote, producto: l.Producto?.nombre, id_producto: l.id_producto,
                laboratorio: l.Laboratorio?.nombre, condicion: l.condicion, existencia: Number(l.cantidad_disponible),
                fecha_vencimiento: l.fecha_vencimiento, semaforo: semaforo(l.fecha_vencimiento, par)
            }))
            .filter(l => l.semaforo.color !== 'verde' || l.condicion !== 'disponible');

        const contratosPorVencer = contratos
            .filter(c => c.dias_para_fin <= par.DIAS_ALERTA_CONTRATO && c.tiene_saldo)
            .map(c => ({ id_contrato: c.id_contrato, numero_contrato: c.numero_contrato, institucion: c.Institucion?.nombre, dias_para_fin: c.dias_para_fin, porcentaje_avance: c.porcentaje_avance }));

        const pedidosActivos = pedidos.filter(p => !['entregado', 'anulado'].includes(p.estado));
        const retrasados = pedidosActivos.filter(p => calcularRetraso(p) > 0);

        // Actividad de los últimos 9 meses
        const [anio, mes] = fechaHoy.split('-').map(Number);
        const meses = [];
        for (let i = 8; i >= 0; i--) {
            const f = new Date(Date.UTC(anio, mes - 1 - i, 1));
            meses.push({ clave: f.toISOString().slice(0, 7), mes: NOMBRES_MES[f.getUTCMonth()], ingresos: 0, pedidos: 0, entregas: 0 });
        }
        const sumar = (fecha, campo) => { const m = fecha && meses.find(x => x.clave === fecha.slice(0, 7)); if (m) m[campo] += 1; };
        ingresos.forEach(i => sumar(i.fecha_recepcion, 'ingresos'));
        pedidos.filter(p => p.estado !== 'anulado').forEach(p => { sumar(p.fecha_pedido, 'pedidos'); sumar(p.fecha_real_entrega, 'entregas'); });

        res.json({
            indicadores: {
                productos: productos.length,
                productos_bajo_minimo: bajoMinimo.length,
                lotes_con_existencia: lotes.filter(l => l.condicion === 'disponible').length,
                lotes_en_alerta: alertasLotes.length,
                contratos_vigentes: contratos.length,
                contratos_por_vencer: contratosPorVencer.length,
                pedidos_en_curso: pedidosActivos.length,
                pedidos_retrasados: retrasados.length
            },
            alertas: { lotes: alertasLotes.slice(0, 50), bajo_minimo: bajoMinimo, contratos: contratosPorVencer },
            pedidos_recientes: pedidos.slice(0, 6).map(p => ({
                id_pedido: p.id_pedido, numero_pedido: p.numero_pedido, institucion: p.Contrato?.Institucion?.nombre,
                numero_contrato: p.Contrato?.numero_contrato, fecha_programada: p.fecha_programada, estado: p.estado,
                estado_texto: ETIQUETAS[p.estado], dias_retraso: calcularRetraso(p)
            })),
            actividad: meses
        });
    } catch (error) { manejarError(res, error, 'Error al cargar el panel de control'); }
};

module.exports = { getPanel };
