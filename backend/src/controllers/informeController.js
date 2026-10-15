// Informes del sistema. Cada informe declara sus filtros y columnas, y
// devuelve filas listas para mostrarse en pantalla o exportarse a PDF.
// Tipos de columna: texto, numero, moneda, fecha, porcentaje.
const { Op } = require('sequelize');
const {
    Pedido, Contrato, Institucion, Ingreso, Proveedor, Lote, Laboratorio, Producto, Movimiento,
    AsignacionLote, DetallePedido, SeguimientoPedido, Auditoria, Usuario, Ubicacion, UnidadMedida, FormaFarmaceutica,
    MotivoMovimiento, ModalidadCompra
} = require('../models/index');
const { manejarError, ErrorNegocio } = require('../utils/errores');
const { obtenerParametros } = require('../services/parametros');
const { semaforo, redondear } = require('../services/inventario');
const { cargarConAvance } = require('./contratoController');
const { calcularRetraso, ETIQUETAS } = require('./pedidoController');
const { INCLUDE_MOVIMIENTO } = require('./movimientoController');
const { resumirLotes } = require('./productoController');
const { lotesSinDestino, esEntregaProxima, resumirEntregas, evaluarContratosCerrados, PEDIDO_CON_CONTRATO } = require('../services/analisis');
const { hoy, esFechaValida, diasEntre, sumarMeses } = require('../utils/fechas');

const col = (clave, titulo, tipo = 'texto') => ({ clave, titulo, tipo });
const ESTADO_LOTE = { disponible: 'Disponible', cuarentena: 'Cuarentena', bloqueado: 'Bloqueado', agotado: 'Agotado', vencido: 'Vencido', anulado: 'Anulado' };

const rango = (p) => ({
    desde: esFechaValida(p.desde) ? p.desde : `${hoy().slice(0, 8)}01`,
    hasta: esFechaValida(p.hasta) ? p.hasta : hoy()
});
const enRango = (fecha, { desde, hasta }) => fecha && fecha >= desde && fecha <= hasta;
const tsRango = ({ desde, hasta }) => ({ [Op.gte]: new Date(`${desde}T00:00:00-06:00`), [Op.lte]: new Date(`${hasta}T23:59:59-06:00`) });

const pedidosConContrato = (where = {}) => Pedido.findAll({
    where,
    include: [{ model: Contrato, attributes: ['numero_contrato', 'nog', 'id_institucion'], include: [{ model: Institucion, attributes: ['id_institucion', 'nombre'] }] }],
    order: [['fecha_programada', 'ASC']]
});

const filaContrato = (c) => ({
    numero_contrato: c.numero_contrato, nog: c.nog, institucion: c.Institucion?.nombre,
    modalidad: c.ModalidadCompra?.nombre, fecha_inicio: c.fecha_inicio, fecha_fin: c.fecha_fin,
    dias_para_fin: c.dias_para_fin, monto_total: Number(c.monto_total), monto_entregado: c.monto_entregado,
    saldo: redondear(Number(c.monto_total) - c.monto_entregado), porcentaje_avance: c.porcentaje_avance
});
const COLS_CONTRATO = [
    col('numero_contrato', 'Contrato'), col('nog', 'NOG'), col('institucion', 'Institución'), col('modalidad', 'Modalidad'),
    col('fecha_inicio', 'Inicio', 'fecha'), col('fecha_fin', 'Fin', 'fecha'), col('dias_para_fin', 'Días para fin', 'numero'),
    col('monto_total', 'Monto', 'moneda'), col('monto_entregado', 'Entregado', 'moneda'), col('saldo', 'Saldo', 'moneda'),
    col('porcentaje_avance', 'Avance', 'porcentaje')
];

const INFORMES = {
    // ---------- Contratos ----------
    'contratos-vigentes': {
        grupo: 'Contratos y ventas', titulo: 'Contratos vigentes', descripcion: 'Contratos en ejecución con su avance de entrega.',
        parametros: ['id_institucion'],
        generar: async (p) => {
            const where = { estado: 'vigente', ...(p.id_institucion ? { id_institucion: p.id_institucion } : {}) };
            const filas = (await cargarConAvance(where)).map(filaContrato);
            return { columnas: COLS_CONTRATO, filas, resumen: { 'Contratos vigentes': filas.length, 'Monto contratado': filas.reduce((s, f) => s + f.monto_total, 0) } };
        }
    },
    'contratos-por-vencer': {
        grupo: 'Contratos y ventas', titulo: 'Contratos próximos a vencer sin cumplir', descripcion: 'Contratos vigentes que terminan pronto y todavía tienen producto por entregar.',
        parametros: ['dias'],
        generar: async (p, par) => {
            const dias = Number(p.dias) || par.DIAS_ALERTA_CONTRATO;
            const filas = (await cargarConAvance({ estado: 'vigente' }))
                .filter(c => c.dias_para_fin <= dias && c.tiene_saldo).map(filaContrato);
            return { columnas: COLS_CONTRATO, filas, resumen: { [`Vencen en ${dias} días o menos`]: filas.length } };
        }
    },
    'avance-contratos': {
        grupo: 'Contratos y ventas', titulo: 'Avance de contratos por renglón', descripcion: 'Cantidad contratada, pedida, entregada y saldo de cada renglón.',
        parametros: ['id_institucion'],
        generar: async (p) => {
            const where = { estado: { [Op.in]: ['vigente', 'vencido', 'completado'] }, ...(p.id_institucion ? { id_institucion: p.id_institucion } : {}) };
            const filas = (await cargarConAvance(where)).flatMap(c => c.renglones.map(r => ({
                numero_contrato: c.numero_contrato, institucion: c.Institucion?.nombre, renglon: r.numero_renglon,
                producto: r.Producto?.nombre, contratada: Number(r.cantidad_contratada), pedida: r.cantidad_pedida,
                entregada: r.cantidad_entregada, saldo: r.saldo_por_entregar,
                precio: Number(r.precio_unitario), monto_saldo: redondear(r.saldo_por_entregar * Number(r.precio_unitario))
            })));
            return {
                columnas: [col('numero_contrato', 'Contrato'), col('institucion', 'Institución'), col('renglon', 'Renglón', 'numero'), col('producto', 'Producto'),
                    col('contratada', 'Contratado', 'numero'), col('pedida', 'Pedido', 'numero'), col('entregada', 'Entregado', 'numero'),
                    col('saldo', 'Saldo', 'numero'), col('precio', 'Precio', 'moneda'), col('monto_saldo', 'Saldo (Q)', 'moneda')],
                filas
            };
        }
    },
    'contratos-incumplidos': {
        grupo: 'Contratos y ventas', titulo: 'Contratos vencidos con saldo pendiente', descripcion: 'Contratos cuyo plazo terminó sin entregar todo lo adjudicado.',
        parametros: [],
        generar: async () => {
            const filas = (await cargarConAvance({ estado: 'vencido' })).filter(c => c.tiene_saldo).map(filaContrato);
            return { columnas: COLS_CONTRATO, filas, resumen: { 'Contratos incumplidos': filas.length, 'Saldo sin entregar': filas.reduce((s, f) => s + f.saldo, 0) } };
        }
    },
    'ventas-por-institucion': {
        grupo: 'Contratos y ventas', titulo: 'Ventas por institución', descripcion: 'Pedidos entregados por institución en el período.',
        parametros: ['desde', 'hasta'],
        generar: async (p) => {
            const r = rango(p);
            const pedidos = (await pedidosConContrato({ estado: 'entregado' })).filter(x => enRango(x.fecha_real_entrega, r));
            const grupos = {};
            pedidos.forEach(x => {
                const n = x.Contrato.Institucion.nombre;
                const g = grupos[n] || (grupos[n] = { institucion: n, pedidos: 0, contratos: new Set(), monto: 0 });
                g.pedidos += 1; g.contratos.add(x.Contrato.numero_contrato); g.monto += Number(x.monto_total);
            });
            const filas = Object.values(grupos).map(g => ({ ...g, contratos: g.contratos.size, monto: redondear(g.monto) })).sort((a, b) => b.monto - a.monto);
            return {
                columnas: [col('institucion', 'Institución'), col('contratos', 'Contratos', 'numero'), col('pedidos', 'Pedidos entregados', 'numero'), col('monto', 'Monto', 'moneda')],
                filas, resumen: { 'Total vendido': filas.reduce((s, f) => s + f.monto, 0) }
            };
        }
    },

    'ventas-por-producto': {
        grupo: 'Contratos y ventas', titulo: 'Ventas por producto', descripcion: 'Unidades y monto entregados de cada producto en el período, incluidos los que no se vendieron.',
        parametros: ['desde', 'hasta'],
        generar: async (p) => {
            const r = rango(p);
            const [productos, detalles] = await Promise.all([
                Producto.findAll({ where: { activo: true }, attributes: ['id_producto', 'codigo', 'nombre', 'concentracion'] }),
                DetallePedido.findAll({
                    include: [{ model: Pedido, attributes: ['fecha_real_entrega'], where: { estado: 'entregado', fecha_real_entrega: { [Op.between]: [r.desde, r.hasta] } }, include: [{ model: Contrato, attributes: ['id_institucion'] }] }]
                })
            ]);
            const filas = productos.map(x => {
                const propios = detalles.filter(d => d.id_producto === x.id_producto && Number(d.cantidad) > 0);
                return {
                    codigo: x.codigo, producto: `${x.nombre} ${x.concentracion || ''}`.trim(),
                    pedidos: new Set(propios.map(d => d.id_pedido)).size,
                    instituciones: new Set(propios.map(d => d.Pedido.Contrato.id_institucion)).size,
                    cantidad: redondear(propios.reduce((s, d) => s + Number(d.cantidad), 0)),
                    monto: redondear(propios.reduce((s, d) => s + Number(d.subtotal), 0))
                };
            }).sort((a, b) => b.monto - a.monto || a.producto.localeCompare(b.producto));
            return {
                columnas: [col('codigo', 'Código'), col('producto', 'Producto'), col('pedidos', 'Pedidos', 'numero'), col('instituciones', 'Instituciones', 'numero'),
                    col('cantidad', 'Unidades entregadas', 'numero'), col('monto', 'Monto', 'moneda')],
                filas, resumen: { 'Total vendido': filas.reduce((s, f) => s + f.monto, 0), 'Productos sin venta': filas.filter(f => !f.cantidad).length }
            };
        }
    },
    'cumplimiento-modalidad': {
        grupo: 'Contratos y ventas', titulo: 'Cumplimiento por tipo de contrato', descripcion: 'Por modalidad de compra: entregas a tiempo, promedio de días de retraso y contratos cerrados cumplidos.',
        parametros: ['desde', 'hasta'],
        generar: async (p) => {
            const r = rango(p);
            const [pedidos, cerrados, modalidades] = await Promise.all([
                Pedido.findAll({ where: { estado: 'entregado', fecha_real_entrega: { [Op.between]: [r.desde, r.hasta] } }, include: [PEDIDO_CON_CONTRATO] }),
                evaluarContratosCerrados(),
                ModalidadCompra.findAll({ order: [['nombre', 'ASC']] })
            ]);
            const filas = modalidades.map(m => {
                const e = resumirEntregas(pedidos.filter(x => x.Contrato.id_modalidad === m.id_modalidad));
                const c = cerrados.filter(x => x.id_modalidad === m.id_modalidad);
                const cumplidos = c.filter(x => x.cumplido).length;
                return {
                    modalidad: m.nombre, entregados: e.entregados, a_tiempo: e.a_tiempo, tasa: e.tasa_a_tiempo, retraso_promedio: e.retraso_promedio,
                    cerrados: c.length, cumplidos, tasa_contratos: c.length ? Math.round((cumplidos / c.length) * 100) : null
                };
            }).filter(f => f.entregados || f.cerrados);
            return {
                columnas: [col('modalidad', 'Modalidad'), col('entregados', 'Pedidos entregados', 'numero'), col('a_tiempo', 'A tiempo', 'numero'),
                    col('tasa', 'Entregas a tiempo', 'porcentaje'), col('retraso_promedio', 'Retraso promedio (días)', 'numero'),
                    col('cerrados', 'Contratos cerrados', 'numero'), col('cumplidos', 'Cerrados cumplidos', 'numero'), col('tasa_contratos', 'Contratos cumplidos', 'porcentaje')],
                filas
            };
        }
    },

    // ---------- Pedidos y entregas ----------
    'entregas-proximas': {
        grupo: 'Pedidos y entregas', titulo: 'Entregas próximas sin despachar', descripcion: 'Pedidos que siguen en bodega y cuya fecha programada llega en los próximos días.',
        parametros: ['dias', 'id_institucion'],
        generar: async (p, par) => {
            const dias = Number(p.dias) || par.DIAS_ALERTA_PEDIDO;
            const filas = (await pedidosConContrato({ estado: { [Op.notIn]: ['entregado', 'anulado'] } }))
                .filter(x => esEntregaProxima(x, dias) && (!p.id_institucion || String(x.Contrato.id_institucion) === String(p.id_institucion)))
                .map(x => ({
                    numero_pedido: x.numero_pedido, institucion: x.Contrato.Institucion.nombre, numero_contrato: x.Contrato.numero_contrato,
                    estado: ETIQUETAS[x.estado], fecha_programada: x.fecha_programada, dias: diasEntre(hoy(), x.fecha_programada), monto: Number(x.monto_total)
                }));
            return {
                columnas: [col('numero_pedido', 'Pedido'), col('institucion', 'Institución'), col('numero_contrato', 'Contrato'), col('estado', 'Estado'),
                    col('fecha_programada', 'Programada', 'fecha'), col('dias', 'Días para la entrega', 'numero'), col('monto', 'Monto', 'moneda')],
                filas, resumen: { [`Entregas en ${dias} días o menos`]: filas.length }
            };
        }
    },
    'pedidos-entregados': {
        grupo: 'Pedidos y entregas', titulo: 'Pedidos entregados', descripcion: 'Pedidos entregados en el período, con su puntualidad.',
        parametros: ['desde', 'hasta', 'id_institucion'],
        generar: async (p) => {
            const r = rango(p);
            const filas = (await pedidosConContrato({ estado: 'entregado' }))
                .filter(x => enRango(x.fecha_real_entrega, r) && (!p.id_institucion || String(x.Contrato.id_institucion) === String(p.id_institucion)))
                .map(x => ({
                    numero_pedido: x.numero_pedido, institucion: x.Contrato.Institucion.nombre, numero_contrato: x.Contrato.numero_contrato,
                    fecha_programada: x.fecha_programada, fecha_real_entrega: x.fecha_real_entrega,
                    dias_retraso: calcularRetraso(x), monto: Number(x.monto_total)
                }));
            return {
                columnas: [col('numero_pedido', 'Pedido'), col('institucion', 'Institución'), col('numero_contrato', 'Contrato'),
                    col('fecha_programada', 'Programada', 'fecha'), col('fecha_real_entrega', 'Entregado', 'fecha'),
                    col('dias_retraso', 'Días de retraso', 'numero'), col('monto', 'Monto', 'moneda')],
                filas, resumen: { 'Pedidos entregados': filas.length, 'A tiempo': filas.filter(f => f.dias_retraso === 0).length }
            };
        }
    },
    'pedidos-pendientes': {
        grupo: 'Pedidos y entregas', titulo: 'Pedidos pendientes y retrasados', descripcion: 'Pedidos que aún no se entregan, indicando los atrasados.',
        parametros: ['id_institucion'],
        generar: async (p) => {
            const filas = (await pedidosConContrato({ estado: { [Op.notIn]: ['entregado', 'anulado'] } }))
                .filter(x => !p.id_institucion || String(x.Contrato.id_institucion) === String(p.id_institucion))
                .map(x => ({
                    numero_pedido: x.numero_pedido, institucion: x.Contrato.Institucion.nombre, numero_contrato: x.Contrato.numero_contrato,
                    estado: ETIQUETAS[x.estado], fecha_programada: x.fecha_programada, dias_retraso: calcularRetraso(x), monto: Number(x.monto_total)
                }));
            return {
                columnas: [col('numero_pedido', 'Pedido'), col('institucion', 'Institución'), col('numero_contrato', 'Contrato'), col('estado', 'Estado'),
                    col('fecha_programada', 'Programada', 'fecha'), col('dias_retraso', 'Días de retraso', 'numero'), col('monto', 'Monto', 'moneda')],
                filas, resumen: { 'Pendientes': filas.length, 'Retrasados': filas.filter(f => f.dias_retraso > 0).length }
            };
        }
    },
    'cumplimiento-entregas': {
        grupo: 'Pedidos y entregas', titulo: 'Cumplimiento de entregas por institución', descripcion: 'Porcentaje de pedidos entregados a tiempo en el período.',
        parametros: ['desde', 'hasta'],
        generar: async (p) => {
            const r = rango(p);
            const grupos = {};
            (await pedidosConContrato({ estado: 'entregado' })).filter(x => enRango(x.fecha_real_entrega, r)).forEach(x => {
                const n = x.Contrato.Institucion.nombre;
                const g = grupos[n] || (grupos[n] = { institucion: n, entregados: 0, a_tiempo: 0, retrasados: 0, suma: 0 });
                const d = calcularRetraso(x);
                g.entregados += 1; d > 0 ? (g.retrasados += 1, g.suma += d) : (g.a_tiempo += 1);
            });
            const filas = Object.values(grupos).map(g => ({
                ...g, porcentaje: Math.round((g.a_tiempo / g.entregados) * 100),
                retraso_promedio: g.retrasados ? redondear(g.suma / g.retrasados) : 0
            }));
            return {
                columnas: [col('institucion', 'Institución'), col('entregados', 'Entregados', 'numero'), col('a_tiempo', 'A tiempo', 'numero'),
                    col('retrasados', 'Con retraso', 'numero'), col('porcentaje', 'Cumplimiento', 'porcentaje'), col('retraso_promedio', 'Retraso promedio (días)', 'numero')],
                filas
            };
        }
    },
    'seguimiento-pedidos': {
        grupo: 'Pedidos y entregas', titulo: 'Seguimiento de pedidos', descripcion: 'Fecha en que cada pedido pasó por cada etapa del despacho.',
        parametros: ['desde', 'hasta'],
        generar: async (p) => {
            const r = rango(p);
            const pedidos = (await pedidosConContrato({ fecha_pedido: { [Op.between]: [r.desde, r.hasta] } }));
            const seg = pedidos.length ? await SeguimientoPedido.findAll({ where: { id_pedido: pedidos.map(x => x.id_pedido) }, order: [['fecha', 'ASC']] }) : [];
            const filas = pedidos.map(x => {
                const fila = { numero_pedido: x.numero_pedido, institucion: x.Contrato.Institucion.nombre, estado: ETIQUETAS[x.estado] };
                seg.filter(s => s.id_pedido === x.id_pedido).forEach(s => { fila[s.estado] = s.fecha.toISOString(); });
                return fila;
            });
            return {
                columnas: [col('numero_pedido', 'Pedido'), col('institucion', 'Institución'), col('estado', 'Estado actual'),
                    col('pendiente', 'Registrado', 'fechahora'), col('en_preparacion', 'Preparación', 'fechahora'), col('empacado', 'Empacado', 'fechahora'),
                    col('en_transporte', 'En transporte', 'fechahora'), col('entregado', 'Entregado', 'fechahora')],
                filas
            };
        }
    },

    // ---------- Inventario ----------
    'existencias': {
        grupo: 'Inventario', titulo: 'Existencias por producto', descripcion: 'Existencia total, apta para despacho y retenida de cada producto.',
        parametros: [],
        generar: async (p, par) => {
            const productos = await Producto.findAll({
                where: { activo: true },
                include: [{ model: Lote, attributes: ['cantidad_disponible', 'condicion', 'fecha_vencimiento'] }, { model: UnidadMedida, attributes: ['nombre'] }, { model: FormaFarmaceutica, attributes: ['nombre'] }],
                order: [['nombre', 'ASC']]
            });
            const filas = productos.map(x => {
                const r = resumirLotes(x.Lotes, par);
                return {
                    codigo: x.codigo, producto: `${x.nombre} ${x.concentracion || ''}`.trim(), forma: x.FormaFarmaceutica?.nombre, unidad: x.UnidadMedida?.nombre,
                    existencia: r.existencia, despachable: r.existencia_despachable, retenida: r.existencia_retenida,
                    lotes: r.lotes_con_existencia, proximo_vencimiento: r.proximo_vencimiento, stock_minimo: x.stock_minimo
                };
            });
            return {
                columnas: [col('codigo', 'Código'), col('producto', 'Producto'), col('forma', 'Forma'), col('unidad', 'Unidad'),
                    col('existencia', 'Existencia', 'numero'), col('despachable', 'Apta despacho', 'numero'), col('retenida', 'Retenida', 'numero'),
                    col('lotes', 'Lotes', 'numero'), col('proximo_vencimiento', 'Próx. vencimiento', 'fecha'), col('stock_minimo', 'Stock mín.', 'numero')],
                filas
            };
        }
    },
    'bajo-minimo': {
        grupo: 'Inventario', titulo: 'Productos bajo el stock mínimo', descripcion: 'Productos cuya existencia disponible es menor al mínimo definido.',
        parametros: [],
        generar: async (p, par) => {
            const base = await INFORMES.existencias.generar(p, par);
            const filas = base.filas.filter(f => f.existencia < Number(f.stock_minimo)).map(f => ({ ...f, faltante: redondear(Number(f.stock_minimo) - f.existencia) }));
            return { columnas: [...base.columnas.filter(c => ['codigo', 'producto', 'existencia', 'stock_minimo'].includes(c.clave)), col('faltante', 'Faltante', 'numero')], filas };
        }
    },
    'lotes-por-vencer': {
        grupo: 'Inventario', titulo: 'Lotes próximos a vencer', descripcion: 'Lotes con existencia que vencen dentro del plazo indicado.',
        parametros: ['dias', 'id_producto'],
        generar: async (p, par) => {
            const dias = Number(p.dias) || par.DIAS_SEMAFORO_AMARILLO;
            const lotes = await Lote.findAll({
                where: { cantidad_disponible: { [Op.gt]: 0 }, condicion: { [Op.in]: ['disponible', 'cuarentena', 'bloqueado'] }, ...(p.id_producto ? { id_producto: p.id_producto } : {}) },
                include: [{ model: Producto, attributes: ['nombre', 'codigo'] }, { model: Laboratorio, attributes: ['nombre'] }, { model: Ubicacion, attributes: ['nombre'] }],
                order: [['fecha_vencimiento', 'ASC']]
            });
            const filas = lotes.map(l => ({ l, s: semaforo(l.fecha_vencimiento, par) })).filter(x => x.s.dias <= dias).map(({ l, s }) => ({
                producto: l.Producto.nombre, numero_lote: l.numero_lote, laboratorio: l.Laboratorio?.nombre, ubicacion: l.Ubicacion?.nombre,
                fecha_vencimiento: l.fecha_vencimiento, dias: s.dias, existencia: Number(l.cantidad_disponible), condicion: ESTADO_LOTE[l.condicion]
            }));
            return {
                columnas: [col('producto', 'Producto'), col('numero_lote', 'Lote'), col('laboratorio', 'Laboratorio'), col('ubicacion', 'Ubicación'),
                    col('fecha_vencimiento', 'Vencimiento', 'fecha'), col('dias', 'Días restantes', 'numero'), col('existencia', 'Existencia', 'numero'), col('condicion', 'Condición')],
                filas, resumen: { [`Lotes que vencen en ${dias} días o menos`]: filas.length }
            };
        }
    },
    'lotes-retenidos': {
        grupo: 'Inventario', titulo: 'Lotes vencidos, bloqueados o en cuarentena', descripcion: 'Existencia que no se puede despachar y requiere una acción.',
        parametros: [],
        generar: async () => {
            const lotes = await Lote.findAll({
                where: { cantidad_disponible: { [Op.gt]: 0 }, condicion: { [Op.in]: ['vencido', 'bloqueado', 'cuarentena'] } },
                include: [{ model: Producto, attributes: ['nombre'] }, { model: Laboratorio, attributes: ['nombre'] }],
                order: [['condicion', 'ASC'], ['fecha_vencimiento', 'ASC']]
            });
            const filas = lotes.map(l => ({
                producto: l.Producto.nombre, numero_lote: l.numero_lote, laboratorio: l.Laboratorio?.nombre, condicion: ESTADO_LOTE[l.condicion],
                motivo: l.motivo_condicion, fecha_vencimiento: l.fecha_vencimiento, existencia: Number(l.cantidad_disponible),
                valor: redondear(Number(l.cantidad_disponible) * Number(l.costo_unitario))
            }));
            return {
                columnas: [col('producto', 'Producto'), col('numero_lote', 'Lote'), col('laboratorio', 'Laboratorio'), col('condicion', 'Condición'), col('motivo', 'Motivo'),
                    col('fecha_vencimiento', 'Vencimiento', 'fecha'), col('existencia', 'Existencia', 'numero'), col('valor', 'Valor a costo', 'moneda')],
                filas, resumen: { 'Valor retenido': filas.reduce((s, f) => s + f.valor, 0) }
            };
        }
    },
    'existencias-lote': {
        grupo: 'Inventario', titulo: 'Existencias por lote', descripcion: 'De qué lotes está hecha la existencia de cada producto, con su vencimiento y si se puede despachar.',
        parametros: ['id_producto', 'id_laboratorio'],
        generar: async (p, par) => {
            const fechaMin = sumarMeses(hoy(), par.VIGENCIA_MINIMA_DESPACHO_MESES);
            const lotes = await Lote.findAll({
                where: {
                    cantidad_disponible: { [Op.gt]: 0 }, condicion: { [Op.ne]: 'anulado' },
                    ...(p.id_producto ? { id_producto: p.id_producto } : {}), ...(p.id_laboratorio ? { id_laboratorio: p.id_laboratorio } : {})
                },
                include: [{ model: Producto, attributes: ['nombre', 'concentracion'] }, { model: Laboratorio, attributes: ['nombre'] }, { model: Ubicacion, attributes: ['nombre'] }],
                order: [[Producto, 'nombre', 'ASC'], ['fecha_vencimiento', 'ASC']]
            });
            const filas = lotes.map(l => ({
                producto: `${l.Producto.nombre} ${l.Producto.concentracion || ''}`.trim(), numero_lote: l.numero_lote, laboratorio: l.Laboratorio?.nombre,
                ubicacion: l.Ubicacion?.nombre, fecha_vencimiento: l.fecha_vencimiento, dias: semaforo(l.fecha_vencimiento, par).dias,
                existencia: Number(l.cantidad_disponible), condicion: ESTADO_LOTE[l.condicion],
                despacho: l.condicion === 'disponible' && l.fecha_vencimiento >= fechaMin ? 'Sí' : 'No'
            }));
            return {
                columnas: [col('producto', 'Producto'), col('numero_lote', 'Lote'), col('laboratorio', 'Laboratorio'), col('ubicacion', 'Ubicación'),
                    col('fecha_vencimiento', 'Vencimiento', 'fecha'), col('dias', 'Días restantes', 'numero'), col('existencia', 'Existencia', 'numero'),
                    col('condicion', 'Condición'), col('despacho', 'Apto despacho')],
                filas, resumen: { 'Lotes': filas.length, 'Unidades': filas.reduce((s, f) => s + f.existencia, 0) }
            };
        }
    },
    'existencias-laboratorio': {
        grupo: 'Inventario', titulo: 'Existencias por casa farmacéutica', descripcion: 'Qué productos y cuántos lotes de cada laboratorio fabricante hay hoy en bodega.',
        parametros: ['id_laboratorio'],
        generar: async (p) => {
            const lotes = await Lote.findAll({
                where: { cantidad_disponible: { [Op.gt]: 0 }, condicion: { [Op.ne]: 'anulado' }, ...(p.id_laboratorio ? { id_laboratorio: p.id_laboratorio } : {}) },
                include: [{ model: Producto, attributes: ['nombre', 'concentracion'] }, { model: Laboratorio, attributes: ['nombre'] }]
            });
            const grupos = {};
            lotes.forEach(l => {
                const k = `${l.Laboratorio.nombre}|${l.id_producto}`;
                const g = grupos[k] || (grupos[k] = { laboratorio: l.Laboratorio.nombre, producto: `${l.Producto.nombre} ${l.Producto.concentracion || ''}`.trim(), lotes: 0, disponible: 0, retenida: 0, proximo_vencimiento: null, valor: 0 });
                const cant = Number(l.cantidad_disponible);
                g.lotes += 1;
                if (l.condicion === 'disponible') {
                    g.disponible += cant;
                    if (!g.proximo_vencimiento || l.fecha_vencimiento < g.proximo_vencimiento) g.proximo_vencimiento = l.fecha_vencimiento;
                } else g.retenida += cant;
                g.valor += cant * Number(l.costo_unitario);
            });
            const filas = Object.values(grupos).map(g => ({ ...g, valor: redondear(g.valor) }))
                .sort((a, b) => a.laboratorio.localeCompare(b.laboratorio) || a.producto.localeCompare(b.producto));
            return {
                columnas: [col('laboratorio', 'Laboratorio'), col('producto', 'Producto'), col('lotes', 'Lotes', 'numero'), col('disponible', 'Disponible', 'numero'),
                    col('retenida', 'Retenida', 'numero'), col('proximo_vencimiento', 'Próx. vencimiento', 'fecha'), col('valor', 'Valor a costo', 'moneda')],
                filas, resumen: { 'Valor en bodega': filas.reduce((s, f) => s + f.valor, 0) }
            };
        }
    },
    'lotes-sin-destino': {
        grupo: 'Inventario', titulo: 'Lotes por vencer sin destino', descripcion: 'Lotes disponibles que ningún contrato vigente puede recibir por su vida útil. Hay que decidir: ofrecerlos a otro cliente, negociar o darlos de baja.',
        parametros: [],
        generar: async (p, par) => {
            const filas = await lotesSinDestino(par);
            return {
                columnas: [col('producto', 'Producto'), col('numero_lote', 'Lote'), col('laboratorio', 'Laboratorio'), col('fecha_vencimiento', 'Vencimiento', 'fecha'),
                    col('dias', 'Días restantes', 'numero'), col('existencia', 'Existencia', 'numero'), col('valor', 'Valor a costo', 'moneda'), col('razon', 'Por qué no tiene destino')],
                filas, resumen: { 'Lotes sin destino': filas.length, 'Valor en riesgo': filas.reduce((s, f) => s + f.valor, 0) }
            };
        }
    },
    'perdidas-vencimiento': {
        grupo: 'Inventario', titulo: 'Lotes vencidos y dados de baja', descripcion: 'Producto vencido en bodega y bajas (destrucción, merma) del período, valorados a costo y por proveedor.',
        parametros: ['desde', 'hasta', 'id_proveedor'],
        generar: async (p) => {
            const r = rango(p);
            const incluirLote = [
                { model: Producto, attributes: ['nombre'] }, { model: Laboratorio, attributes: ['nombre'] },
                { model: Ingreso, attributes: ['serie_factura', 'numero_factura', 'id_proveedor'], include: [{ model: Proveedor, attributes: ['nombre'] }] }
            ];
            const [vencidos, bajas] = await Promise.all([
                Lote.findAll({ where: { condicion: 'vencido', cantidad_disponible: { [Op.gt]: 0 } }, include: incluirLote }),
                Movimiento.findAll({
                    where: { tipo_movimiento: 'salida', fecha_movimiento: tsRango(r) },
                    include: [{ model: MotivoMovimiento, attributes: ['nombre'], where: { codigo: { [Op.in]: ['DESTRUCCION', 'MERMA'] } } }, { model: Lote, include: incluirLote }]
                })
            ]);
            const fila = (l, tipo, cantidad, fecha) => ({
                tipo, fecha, producto: l.Producto.nombre, numero_lote: l.numero_lote, laboratorio: l.Laboratorio?.nombre,
                proveedor: l.Ingreso?.Proveedor?.nombre, id_proveedor: l.Ingreso?.id_proveedor,
                factura: l.Ingreso ? `${l.Ingreso.serie_factura}-${l.Ingreso.numero_factura}` : '',
                cantidad, valor: redondear(cantidad * Number(l.costo_unitario))
            });
            const filas = [
                ...vencidos.map(l => fila(l, 'Vencido en bodega', Number(l.cantidad_disponible), l.fecha_vencimiento)),
                ...bajas.map(m => fila(m.Lote, `Baja: ${m.MotivoMovimiento.nombre}`, Number(m.cantidad), m.fecha_movimiento.toISOString().slice(0, 10)))
            ].filter(f => !p.id_proveedor || String(f.id_proveedor) === String(p.id_proveedor))
                .sort((a, b) => (a.proveedor || '').localeCompare(b.proveedor || '') || a.fecha.localeCompare(b.fecha));
            return {
                columnas: [col('proveedor', 'Proveedor'), col('tipo', 'Tipo'), col('fecha', 'Fecha', 'fecha'), col('producto', 'Producto'), col('numero_lote', 'Lote'),
                    col('laboratorio', 'Laboratorio'), col('factura', 'Factura'), col('cantidad', 'Cantidad', 'numero'), col('valor', 'Valor a costo', 'moneda')],
                filas, resumen: { 'Valor perdido': filas.reduce((s, f) => s + f.valor, 0) }
            };
        }
    },
    'kardex': {
        grupo: 'Inventario', titulo: 'Kárdex de movimientos', descripcion: 'Entradas y salidas por lote en el período, con su origen o destino.',
        parametros: ['desde', 'hasta', 'id_producto'],
        generar: async (p) => {
            const r = rango(p);
            const where = { fecha_movimiento: tsRango(r) };
            if (p.id_producto) where['$Lote.id_producto$'] = p.id_producto;
            const movs = await Movimiento.findAll({ where, include: INCLUDE_MOVIMIENTO, order: [['fecha_movimiento', 'ASC'], ['id_movimiento', 'ASC']] });
            const filas = movs.map(m => ({
                fecha: m.fecha_movimiento.toISOString(), producto: m.Lote?.Producto?.nombre, numero_lote: m.Lote?.numero_lote,
                motivo: m.MotivoMovimiento?.nombre,
                entrada: m.tipo_movimiento === 'entrada' ? Number(m.cantidad) : null,
                salida: m.tipo_movimiento === 'salida' ? Number(m.cantidad) : null,
                saldo: Number(m.saldo),
                referencia: m.Pedido ? `${m.Pedido.numero_pedido} · ${m.Pedido.Contrato?.Institucion?.nombre}` : m.Ingreso ? `Factura ${m.Ingreso.serie_factura}-${m.Ingreso.numero_factura}` : (m.observacion || ''),
                usuario: m.Usuario ? `${m.Usuario.nombre} ${m.Usuario.apellido}` : 'Sistema'
            }));
            return {
                columnas: [col('fecha', 'Fecha', 'fechahora'), col('producto', 'Producto'), col('numero_lote', 'Lote'), col('motivo', 'Motivo'),
                    col('entrada', 'Entrada', 'numero'), col('salida', 'Salida', 'numero'), col('saldo', 'Saldo lote', 'numero'), col('referencia', 'Referencia'), col('usuario', 'Usuario')],
                filas
            };
        }
    },

    // ---------- Compras y trazabilidad ----------
    'ingresos-proveedor': {
        grupo: 'Compras y trazabilidad', titulo: 'Ingresos por proveedor', descripcion: 'Facturas de compra recibidas en el período.',
        parametros: ['desde', 'hasta', 'id_proveedor'],
        generar: async (p) => {
            const r = rango(p);
            const ingresos = await Ingreso.findAll({
                where: { estado: 'registrado', fecha_recepcion: { [Op.between]: [r.desde, r.hasta] }, ...(p.id_proveedor ? { id_proveedor: p.id_proveedor } : {}) },
                include: [{ model: Proveedor, attributes: ['nombre', 'nit'] }, { model: Lote, attributes: ['id_lote'] }],
                order: [['fecha_recepcion', 'ASC']]
            });
            const filas = ingresos.map(i => ({
                fecha_recepcion: i.fecha_recepcion, proveedor: i.Proveedor.nombre, nit: i.Proveedor.nit,
                factura: `${i.serie_factura}-${i.numero_factura}`, fecha_factura: i.fecha_factura, lotes: i.Lotes.length, monto: Number(i.monto_total)
            }));
            return {
                columnas: [col('fecha_recepcion', 'Recepción', 'fecha'), col('proveedor', 'Proveedor'), col('nit', 'NIT'), col('factura', 'Factura'),
                    col('fecha_factura', 'Fecha factura', 'fecha'), col('lotes', 'Lotes', 'numero'), col('monto', 'Monto', 'moneda')],
                filas, resumen: { 'Facturas': filas.length, 'Total comprado': filas.reduce((s, f) => s + f.monto, 0) }
            };
        }
    },
    'compras-laboratorio': {
        grupo: 'Compras y trazabilidad', titulo: 'Compras por laboratorio fabricante', descripcion: 'Qué se compró de cada casa farmacéutica en el período.',
        parametros: ['desde', 'hasta', 'id_laboratorio'],
        generar: async (p) => {
            const r = rango(p);
            const lotes = await Lote.findAll({
                where: { condicion: { [Op.ne]: 'anulado' }, ...(p.id_laboratorio ? { id_laboratorio: p.id_laboratorio } : {}) },
                include: [
                    { model: Ingreso, attributes: ['fecha_recepcion'], where: { estado: 'registrado', fecha_recepcion: { [Op.between]: [r.desde, r.hasta] } } },
                    { model: Laboratorio, attributes: ['nombre'] }, { model: Producto, attributes: ['nombre'] }
                ]
            });
            const grupos = {};
            lotes.forEach(l => {
                const k = `${l.Laboratorio.nombre}|${l.Producto.nombre}`;
                const g = grupos[k] || (grupos[k] = { laboratorio: l.Laboratorio.nombre, producto: l.Producto.nombre, lotes: 0, cantidad: 0, costo: 0 });
                g.lotes += 1; g.cantidad += Number(l.cantidad_recibida); g.costo += Number(l.cantidad_recibida) * Number(l.costo_unitario);
            });
            const filas = Object.values(grupos).map(g => ({ ...g, cantidad: redondear(g.cantidad), costo: redondear(g.costo) }))
                .sort((a, b) => a.laboratorio.localeCompare(b.laboratorio) || a.producto.localeCompare(b.producto));
            return {
                columnas: [col('laboratorio', 'Laboratorio'), col('producto', 'Producto'), col('lotes', 'Lotes', 'numero'), col('cantidad', 'Cantidad', 'numero'), col('costo', 'Costo total', 'moneda')],
                filas
            };
        }
    },
    'distribucion-lotes': {
        grupo: 'Compras y trazabilidad', titulo: 'Distribución de lotes (trazabilidad)', descripcion: 'A qué instituciones se despachó cada lote, con su origen.',
        parametros: ['desde', 'hasta', 'numero_lote', 'id_producto', 'id_laboratorio', 'id_institucion'],
        generar: async (p) => {
            const r = rango(p);
            const whereLote = {};
            if (p.numero_lote) whereLote.numero_lote = { [Op.iLike]: `%${p.numero_lote}%` };
            if (p.id_producto) whereLote.id_producto = p.id_producto;
            if (p.id_laboratorio) whereLote.id_laboratorio = p.id_laboratorio;
            const asig = await AsignacionLote.findAll({
                include: [
                    {
                        model: Lote, where: whereLote, required: true,
                        include: [{ model: Producto, attributes: ['nombre'] }, { model: Laboratorio, attributes: ['nombre'] }, { model: Ingreso, attributes: ['serie_factura', 'numero_factura'], include: [{ model: Proveedor, attributes: ['nombre'] }] }]
                    },
                    {
                        model: DetallePedido, required: true,
                        include: [{
                            model: Pedido, required: true, where: { estado: { [Op.ne]: 'anulado' }, fecha_pedido: { [Op.between]: [r.desde, r.hasta] } },
                            include: [{ model: Contrato, include: [{ model: Institucion, attributes: ['id_institucion', 'nombre'] }] }]
                        }]
                    }
                ],
                order: [['id_asignacion', 'ASC']]
            });
            const filas = asig
                .filter(a => !p.id_institucion || String(a.DetallePedido.Pedido.Contrato.Institucion.id_institucion) === String(p.id_institucion))
                .map(a => ({
                    numero_lote: a.Lote.numero_lote, producto: a.Lote.Producto.nombre, laboratorio: a.Lote.Laboratorio?.nombre,
                    proveedor: a.Lote.Ingreso?.Proveedor?.nombre, factura: a.Lote.Ingreso ? `${a.Lote.Ingreso.serie_factura}-${a.Lote.Ingreso.numero_factura}` : '',
                    institucion: a.DetallePedido.Pedido.Contrato.Institucion.nombre, numero_pedido: a.DetallePedido.Pedido.numero_pedido,
                    fecha: a.DetallePedido.Pedido.fecha_real_entrega || a.DetallePedido.Pedido.fecha_pedido,
                    estado: ETIQUETAS[a.DetallePedido.Pedido.estado], cantidad: Number(a.cantidad)
                }));
            return {
                columnas: [col('numero_lote', 'Lote'), col('producto', 'Producto'), col('laboratorio', 'Laboratorio'), col('proveedor', 'Proveedor'), col('factura', 'Factura'),
                    col('institucion', 'Institución'), col('numero_pedido', 'Pedido'), col('fecha', 'Fecha', 'fecha'), col('estado', 'Estado'), col('cantidad', 'Cantidad', 'numero')],
                filas
            };
        }
    },

    'instituciones-lote': {
        grupo: 'Compras y trazabilidad', titulo: 'Instituciones que recibieron un lote', descripcion: 'Para un retiro del mercado: a quién se entregó el lote y cómo contactarlo.',
        parametros: ['numero_lote', 'id_producto', 'id_laboratorio'],
        generar: async (p) => {
            if (!p.numero_lote && !p.id_producto && !p.id_laboratorio) throw new ErrorNegocio('Indica el número de lote, el producto o el laboratorio.');
            const whereLote = {};
            if (p.numero_lote) whereLote.numero_lote = { [Op.iLike]: `%${String(p.numero_lote).trim()}%` };
            if (p.id_producto) whereLote.id_producto = p.id_producto;
            if (p.id_laboratorio) whereLote.id_laboratorio = p.id_laboratorio;
            const asig = await AsignacionLote.findAll({
                include: [
                    { model: Lote, where: whereLote, required: true, attributes: ['numero_lote'], include: [{ model: Producto, attributes: ['nombre'] }] },
                    {
                        model: DetallePedido, required: true,
                        include: [{
                            model: Pedido, required: true, where: { estado: { [Op.ne]: 'anulado' } },
                            include: [{ model: Contrato, attributes: ['numero_contrato'], include: [{ model: Institucion }] }]
                        }]
                    }
                ]
            });
            const grupos = {};
            asig.forEach(a => {
                const inst = a.DetallePedido.Pedido.Contrato.Institucion;
                const g = grupos[inst.id_institucion] || (grupos[inst.id_institucion] = {
                    institucion: inst.nombre, departamento: inst.departamento, contacto: inst.contacto, telefono: inst.telefono, email: inst.email,
                    lotes: new Set(), pedidos: new Set(), cantidad: 0
                });
                g.lotes.add(`${a.Lote.numero_lote} (${a.Lote.Producto.nombre})`);
                g.pedidos.add(a.DetallePedido.Pedido.numero_pedido);
                g.cantidad += Number(a.cantidad);
            });
            const filas = Object.values(grupos).map(g => ({ ...g, lotes: [...g.lotes].join(', '), pedidos: [...g.pedidos].join(', '), cantidad: redondear(g.cantidad) }));
            return {
                columnas: [col('institucion', 'Institución'), col('departamento', 'Departamento'), col('contacto', 'Contacto'), col('telefono', 'Teléfono'),
                    col('email', 'Correo'), col('lotes', 'Lotes'), col('pedidos', 'Pedidos'), col('cantidad', 'Unidades', 'numero')],
                filas, resumen: { 'Instituciones a avisar': filas.length }
            };
        }
    },

    // ---------- Control ----------
    'bitacora': {
        grupo: 'Control', titulo: 'Bitácora de auditoría', descripcion: 'Quién creó, modificó, anuló o restauró cada registro.',
        parametros: ['desde', 'hasta', 'id_usuario'],
        generar: async (p) => {
            const r = rango(p);
            const where = { fecha: tsRango(r) };
            if (p.id_usuario) where.id_usuario = p.id_usuario;
            const regs = await Auditoria.findAll({ where, include: [{ model: Usuario, attributes: ['nombre', 'apellido', 'rol'] }], order: [['fecha', 'ASC']], limit: 5000 });
            const filas = regs.map(a => ({
                fecha: a.fecha.toISOString(), usuario: a.Usuario ? `${a.Usuario.nombre} ${a.Usuario.apellido}` : 'Sistema',
                rol: a.Usuario?.rol || '', tabla: a.tabla, id_registro: a.id_registro, accion: a.accion, motivo: a.motivo || ''
            }));
            return {
                columnas: [col('fecha', 'Fecha', 'fechahora'), col('usuario', 'Usuario'), col('rol', 'Rol'), col('tabla', 'Módulo'),
                    col('id_registro', 'Registro'), col('accion', 'Acción'), col('motivo', 'Motivo')],
                filas
            };
        }
    },
    'registros-anulados': {
        grupo: 'Control', titulo: 'Registros anulados', descripcion: 'Qué se anuló en el período, quién lo hizo, por qué y si después se restauró.',
        parametros: ['desde', 'hasta', 'id_usuario'],
        generar: async (p) => {
            const r = rango(p);
            const where = { accion: 'anular', fecha: tsRango(r) };
            if (p.id_usuario) where.id_usuario = p.id_usuario;
            const anulaciones = await Auditoria.findAll({ where, include: [{ model: Usuario, attributes: ['nombre', 'apellido'] }], order: [['fecha', 'ASC']] });
            const restauraciones = anulaciones.length ? await Auditoria.findAll({
                where: { accion: 'restaurar', [Op.or]: anulaciones.map(a => ({ tabla: a.tabla, id_registro: a.id_registro })) },
                attributes: ['tabla', 'id_registro', 'fecha']
            }) : [];
            const filas = anulaciones.map(a => {
                const restaurado = restauraciones.find(x => x.tabla === a.tabla && x.id_registro === a.id_registro && x.fecha > a.fecha);
                const datos = a.datos_antes || {};
                return {
                    fecha: a.fecha.toISOString(), tabla: TABLAS[a.tabla] || a.tabla,
                    registro: datos.numero_pedido || datos.numero_contrato || datos.numero_lote || datos.nombre || datos.nombre_archivo || (datos.numero_factura ? `${datos.serie_factura}-${datos.numero_factura}` : a.id_registro),
                    usuario: a.Usuario ? `${a.Usuario.nombre} ${a.Usuario.apellido}` : 'Sistema', motivo: a.motivo || '',
                    restaurado: restaurado ? `Sí, ${restaurado.fecha.toISOString().slice(0, 10)}` : 'No'
                };
            });
            return {
                columnas: [col('fecha', 'Fecha', 'fechahora'), col('tabla', 'Módulo'), col('registro', 'Registro'), col('usuario', 'Anulado por'),
                    col('motivo', 'Motivo'), col('restaurado', 'Restaurado')],
                filas, resumen: { 'Anulaciones': filas.length, 'Siguen anuladas': filas.filter(f => f.restaurado === 'No').length }
            };
        }
    }
};

const TABLAS = {
    productos: 'Productos', lotes: 'Lotes', ingresos: 'Ingresos de compra', contratos: 'Contratos', pedidos: 'Pedidos',
    instituciones: 'Instituciones', usuarios: 'Usuarios', proveedores: 'Proveedores', laboratorios: 'Laboratorios'
};

// La pregunta concreta que contesta cada informe (documento "Casos y lo que falta", sección 6)
const PREGUNTAS = {
    'contratos-vigentes': '¿Con quién tengo compromisos hoy y por cuánto?',
    'contratos-por-vencer': '¿Qué contrato vence pronto y todavía me falta entregar?',
    'avance-contratos': 'De lo que se firmó, ¿cuánto se ha entregado y cuánto falta?',
    'contratos-incumplidos': '¿Qué contratos terminaron sin entregar todo?',
    'ventas-por-institucion': '¿Qué institución me compra más?',
    'ventas-por-producto': '¿Qué producto rota más y cuál se estanca?',
    'cumplimiento-modalidad': '¿En qué tipo de contrato me atraso más?',
    'entregas-proximas': '¿Qué tengo que despachar en los próximos días para no atrasarme?',
    'pedidos-entregados': '¿Qué se entregó en el período y a quién?',
    'pedidos-pendientes': '¿Qué estoy debiendo y con cuántos días de atraso?',
    'cumplimiento-entregas': '¿A qué institución le cumplo a tiempo y a cuál no?',
    'seguimiento-pedidos': '¿Cuándo pasó cada pedido por cada etapa del despacho?',
    'existencias': '¿Cuánto tengo en total de cada producto?',
    'bajo-minimo': '¿Qué tengo que volver a comprar?',
    'lotes-por-vencer': '¿Qué debo vender primero?',
    'lotes-retenidos': '¿Qué existencia no puedo despachar y por qué?',
    'existencias-lote': '¿De qué lotes está hecha la existencia y cuándo vence cada uno?',
    'existencias-laboratorio': '¿Qué tengo de cada casa farmacéutica en este momento?',
    'lotes-sin-destino': '¿Qué lotes están por vencer y ningún contrato los puede recibir?',
    'perdidas-vencimiento': '¿Cuánto perdí por vencimiento y de qué proveedor?',
    'kardex': '¿Qué entró, qué salió y cuál es el saldo, movimiento por movimiento?',
    'ingresos-proveedor': '¿A quién le compro y cuánto?',
    'compras-laboratorio': '¿Qué le compré a cada casa farmacéutica?',
    'distribucion-lotes': '¿De dónde vino este lote y a dónde fue?',
    'instituciones-lote': '¿A quién aviso si este lote se retira?',
    'bitacora': '¿Qué hizo esta persona y cuándo?',
    'registros-anulados': '¿Qué se anuló, quién lo anuló y por qué?'
};

// Catálogo para el menú de informes
const getCatalogo = (req, res) => {
    res.json(Object.entries(INFORMES).map(([clave, i]) => ({ clave, grupo: i.grupo, titulo: i.titulo, pregunta: PREGUNTAS[clave], descripcion: i.descripcion, parametros: i.parametros })));
};

const generarInforme = async (req, res) => {
    try {
        const informe = INFORMES[req.params.clave];
        if (!informe) throw new ErrorNegocio('Informe no encontrado', 404);
        const parametros = await obtenerParametros();
        const resultado = await informe.generar(req.query, parametros);
        const usaRango = informe.parametros.includes('desde');
        res.json({
            clave: req.params.clave,
            titulo: informe.titulo,
            pregunta: PREGUNTAS[req.params.clave],
            descripcion: informe.descripcion,
            generado: new Date().toISOString(),
            ...(usaRango ? { rango: rango(req.query) } : {}),
            ...resultado
        });
    } catch (error) { manejarError(res, error, 'Error al generar el informe'); }
};

module.exports = { getCatalogo, generarInforme };
