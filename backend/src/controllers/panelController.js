// Panel de control: lo que cada persona tiene que atender hoy, indicadores,
// alertas (vencimientos, entregas, contratos) y actividad reciente.
const { Op } = require('sequelize');
const { Producto, Lote, Contrato, Pedido, Ingreso, Institucion, Laboratorio, Auditoria, Usuario, TramiteContrato, ModalidadCompra, DetalleContrato } = require('../models/index');
const { manejarError } = require('../utils/errores');
const { obtenerParametros } = require('../services/parametros');
const { semaforo, redondear } = require('../services/inventario');
const { calcularRetraso, fechaLimite, esEntregaProxima, lotesSinDestino, indicadoresCumplimiento } = require('../services/analisis');
const { resumirLotes } = require('./productoController');
const { cargarConAvance } = require('./contratoController');
const { ETIQUETAS } = require('./pedidoController');
const { hoy, diasEntre, sumarMeses, sumarDias } = require('../utils/fechas');

const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const TABLAS = {
    productos: 'producto', lotes: 'lote', ingresos: 'ingreso', contratos: 'contrato', pedidos: 'pedido', instituciones: 'institución',
    usuarios: 'usuario', parametros: 'parámetro', tramites_contrato: 'trámite', devoluciones_pedido: 'devolución'
};

// Texto corto para la bitácora reciente del panel ("Ana López entregó PED-2026-00010")
const describirCambio = (a) => {
    const d = a.datos_despues || a.datos_antes || {};
    const nombre = d.numero_pedido || d.numero_contrato || d.numero_lote || (d.numero_factura ? `factura ${d.serie_factura}-${d.numero_factura}` : null) || d.nombre || `#${a.id_registro}`;
    return { que: TABLAS[a.tabla] || a.tabla, nombre, estado: a.accion === 'cambio_estado' ? (d.estado || d.condicion) : null };
};

const resumenPedido = (p) => ({
    id_pedido: p.id_pedido, numero_pedido: p.numero_pedido, institucion: p.Contrato?.Institucion?.nombre,
    numero_contrato: p.Contrato?.numero_contrato, fecha_programada: p.fecha_programada, estado: p.estado,
    estado_texto: ETIQUETAS[p.estado], dias_retraso: calcularRetraso(p), dias_para_entrega: diasEntre(hoy(), fechaLimite(p))
});

// Trámites que piden atención: prórrogas sin resolver, notas técnicas vigentes
// (cuándo se vuelve a abastecer) e instituciones cerca del límite de oficios
const alertasTramites = async (par) => {
    const fechaHoy = hoy();
    const [tramites, oficios] = await Promise.all([
        TramiteContrato.findAll({
            where: {
                [Op.or]: [
                    { tipo: 'prorroga', estado: 'solicitada' },
                    { tipo: 'nota_tecnica', estado: { [Op.in]: ['solicitada', 'aprobada'] }, fecha_hasta: { [Op.gte]: fechaHoy } }
                ]
            },
            include: [
                { model: Contrato, attributes: ['id_contrato', 'numero_contrato', 'fecha_fin'], include: [{ model: Institucion, attributes: ['nombre'] }] },
                { model: DetalleContrato, attributes: ['numero_renglon'], include: [{ model: Producto, attributes: ['nombre'] }] }
            ],
            order: [['fecha_hasta', 'ASC']]
        }),
        TramiteContrato.findAll({
            where: { tipo: 'oficio', estado: 'registrado' }, attributes: ['id_tramite'],
            include: [{
                model: Contrato, attributes: ['id_institucion'], required: true,
                include: [{ model: Institucion, attributes: ['id_institucion', 'nombre'] }, { model: ModalidadCompra, attributes: [], required: true, where: { contrato_abierto: false } }]
            }]
        })
    ]);
    const porInstitucion = {};
    oficios.forEach(o => {
        const i = o.Contrato.Institucion;
        const g = porInstitucion[i.id_institucion] || (porInstitucion[i.id_institucion] = { id_institucion: i.id_institucion, institucion: i.nombre, oficios: 0 });
        g.oficios += 1;
    });
    return {
        tramites: tramites.map(t => ({
            id_tramite: t.id_tramite, tipo: t.tipo, estado: t.estado, numero_documento: t.numero_documento,
            id_contrato: t.Contrato.id_contrato, numero_contrato: t.Contrato.numero_contrato, institucion: t.Contrato.Institucion?.nombre,
            producto: t.DetalleContrato?.Producto?.nombre, fecha_hasta: t.fecha_hasta,
            dias_para_fin_contrato: diasEntre(fechaHoy, t.Contrato.fecha_fin), dias_restantes: diasEntre(fechaHoy, t.fecha_hasta)
        })),
        oficios: Object.values(porInstitucion).filter(g => g.oficios >= par.LIMITE_OFICIOS - 1).sort((a, b) => b.oficios - a.oficios)
    };
};

const getPanel = async (req, res) => {
    try {
        const par = await obtenerParametros();
        const fechaHoy = hoy();

        const [productos, lotes, contratos, pedidos, ingresos, sinDestino, cumplimiento, tramites] = await Promise.all([
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
            Ingreso.findAll({ where: { estado: 'registrado' }, attributes: ['fecha_recepcion'] }),
            lotesSinDestino(par),
            indicadoresCumplimiento(),
            alertasTramites(par)
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
            .map(c => ({
                id_contrato: c.id_contrato, numero_contrato: c.numero_contrato, institucion: c.Institucion?.nombre, dias_para_fin: c.dias_para_fin,
                porcentaje_avance: c.porcentaje_avance, ultimo_dia_pedido: c.ultimo_dia_pedido, contrato_abierto: c.contrato_abierto
            }));

        const pedidosActivos = pedidos.filter(p => !['entregado', 'anulado'].includes(p.estado));
        const retrasados = pedidosActivos.filter(p => calcularRetraso(p) > 0);
        // Alerta preventiva: todavía en bodega y la fecha programada llega en pocos días
        const entregasProximas = pedidosActivos
            .filter(p => esEntregaProxima(p, par.DIAS_ALERTA_PEDIDO))
            .sort((a, b) => a.fecha_programada.localeCompare(b.fecha_programada));
        const enEstado = (estado) => pedidosActivos.filter(p => p.estado === estado).length;

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

        // ----- Gráficas -----
        // Entregas por mes: a tiempo / con retraso y monto entregado
        pedidos.filter(p => p.estado === 'entregado').forEach(p => {
            const m = meses.find(x => x.clave === p.fecha_real_entrega?.slice(0, 7));
            if (!m) return;
            calcularRetraso(p) > 0 ? (m.con_retraso = (m.con_retraso || 0) + 1) : (m.a_tiempo = (m.a_tiempo || 0) + 1);
            m.monto_entregado = redondear((m.monto_entregado || 0) + Number(p.monto_total));
        });
        meses.forEach(m => { m.a_tiempo = m.a_tiempo || 0; m.con_retraso = m.con_retraso || 0; m.monto_entregado = m.monto_entregado || 0; });

        // Valor del inventario (a costo) según si se puede despachar
        const fechaMinDespacho = sumarMeses(fechaHoy, par.VIGENCIA_MINIMA_DESPACHO_MESES);
        const valor = { apto: 0, vida_corta: 0, retenido: 0, vencido: 0 };
        lotes.forEach(l => {
            const v = Number(l.cantidad_disponible) * Number(l.costo_unitario);
            if (l.condicion === 'vencido') valor.vencido += v;
            else if (l.condicion !== 'disponible') valor.retenido += v;
            else if (l.fecha_vencimiento >= fechaMinDespacho) valor.apto += v;
            else valor.vida_corta += v;
        });
        Object.keys(valor).forEach(k => { valor[k] = redondear(valor[k]); });

        // Vencimientos de los próximos 12 meses (unidades y valor), con el color del semáforo
        const vencimientos = [];
        for (let i = 0; i < 12; i++) {
            const f = new Date(Date.UTC(anio, mes - 1 + i, 1));
            const clave = f.toISOString().slice(0, 7);
            const finMes = sumarDias(new Date(Date.UTC(anio, mes + i, 1)).toISOString().slice(0, 10), -1);
            const dias = diasEntre(fechaHoy, finMes);
            vencimientos.push({
                clave, mes: `${NOMBRES_MES[f.getUTCMonth()]} ${String(f.getUTCFullYear()).slice(2)}`, unidades: 0, valor: 0, lotes: 0,
                color: dias <= par.DIAS_SEMAFORO_ROJO ? 'rojo' : dias <= par.DIAS_SEMAFORO_AMARILLO ? 'amarillo' : 'verde'
            });
        }
        lotes.filter(l => l.condicion !== 'vencido').forEach(l => {
            const b = vencimientos.find(x => x.clave === l.fecha_vencimiento.slice(0, 7));
            if (!b) return;
            b.lotes += 1; b.unidades += Number(l.cantidad_disponible);
            b.valor = redondear(b.valor + Number(l.cantidad_disponible) * Number(l.costo_unitario));
        });

        // Avance de cada contrato vigente contra el tiempo que ya pasó de su plazo
        const avanceContratos = contratos.map(c => {
            const plazo = Math.max(1, diasEntre(c.fecha_inicio, c.fecha_fin));
            const transcurrido = Math.min(100, Math.max(0, Math.round((diasEntre(c.fecha_inicio, fechaHoy) / plazo) * 100)));
            return {
                id_contrato: c.id_contrato, numero_contrato: c.numero_contrato, institucion: c.Institucion?.nombre,
                avance: c.porcentaje_avance, tiempo: transcurrido, dias_para_fin: c.dias_para_fin, atrasado: c.porcentaje_avance + 10 < transcurrido
            };
        }).sort((a, b) => (b.tiempo - b.avance) - (a.tiempo - a.avance));

        // Puntualidad por institución en los últimos 12 meses
        const desde12 = sumarDias(fechaHoy, -365);
        const porInstitucion = {};
        pedidos.filter(p => p.estado === 'entregado' && p.fecha_real_entrega >= desde12).forEach(p => {
            const n = p.Contrato?.Institucion?.nombre || '—';
            const g = porInstitucion[n] || (porInstitucion[n] = { institucion: n, a_tiempo: 0, con_retraso: 0 });
            calcularRetraso(p) > 0 ? g.con_retraso++ : g.a_tiempo++;
        });
        const cumplimientoInstituciones = Object.values(porInstitucion)
            .map(g => ({ ...g, entregados: g.a_tiempo + g.con_retraso, porcentaje: Math.round((g.a_tiempo / (g.a_tiempo + g.con_retraso)) * 100) }))
            .sort((a, b) => a.porcentaje - b.porcentaje);

        // Bitácora reciente (solo quien puede ver la auditoría)
        const bitacora = ['administrador', 'gerente'].includes(req.usuario.rol)
            ? (await Auditoria.findAll({ include: [{ model: Usuario, attributes: ['nombre', 'apellido'] }], order: [['fecha', 'DESC'], ['id_auditoria', 'DESC']], limit: 8 }))
                .map(a => ({ id: a.id_auditoria, fecha: a.fecha, accion: a.accion, tabla: a.tabla, motivo: a.motivo, usuario: a.Usuario ? `${a.Usuario.nombre} ${a.Usuario.apellido}` : 'Sistema', ...describirCambio(a) }))
            : null;

        res.json({
            graficas: { valor_inventario: valor, vencimientos, avance_contratos: avanceContratos, cumplimiento_instituciones: cumplimientoInstituciones },
            bitacora,
            parametros: { dias_alerta_pedido: par.DIAS_ALERTA_PEDIDO, dias_alerta_contrato: par.DIAS_ALERTA_CONTRATO, limite_oficios: par.LIMITE_OFICIOS },
            indicadores: {
                productos: productos.length,
                productos_bajo_minimo: bajoMinimo.length,
                lotes_con_existencia: lotes.filter(l => l.condicion === 'disponible').length,
                lotes_en_alerta: alertasLotes.length,
                lotes_sin_destino: sinDestino.length,
                contratos_vigentes: contratos.length,
                contratos_por_vencer: contratosPorVencer.length,
                pedidos_en_curso: pedidosActivos.length,
                pedidos_retrasados: retrasados.length,
                entregas_proximas: entregasProximas.length
            },
            // Pendientes por etapa del despacho: el panel muestra a cada rol los suyos
            tareas: {
                por_preparar: enEstado('pendiente'),
                por_empacar: enEstado('en_preparacion'),
                por_enviar: enEstado('empacado'),
                por_confirmar_entrega: enEstado('en_transporte')
            },
            cumplimiento,
            alertas: {
                lotes: alertasLotes.slice(0, 50),
                bajo_minimo: bajoMinimo,
                contratos: contratosPorVencer,
                entregas_proximas: entregasProximas.map(resumenPedido),
                retrasados: retrasados.map(resumenPedido),
                sin_destino: sinDestino.slice(0, 20),
                tramites: tramites.tramites,
                oficios: tramites.oficios
            },
            pedidos_recientes: pedidos.slice(0, 6).map(resumenPedido),
            actividad: meses
        });
    } catch (error) { manejarError(res, error, 'Error al cargar el panel de control'); }
};

module.exports = { getPanel };
