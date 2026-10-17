// Historial de operación de ~10 meses para demostrar el sistema con datos
// realistas: compras, contratos abiertos y cerrados, pedidos entregados a
// tiempo y con retraso, un pedido retrasado hoy, entregas próximas, lotes
// por vencer sin destino, un lote vencido con destrucción parcial, lotes en
// cuarentena y retirados del mercado, una fecha corregida (caso 3) y un lote
// duplicado anulado (caso 9). Además crea un usuario de cada rol.
//
// Los hechos se registran en orden cronológico con las mismas reglas del
// inventario (services/inventario.js), así el kárdex y los saldos cuadran.
// Las fechas son relativas a hoy. Solo se ejecuta una vez.
// Uso: npm run seed:historial
require('../config/entorno');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const M = require('../models/index');
const { sembrarCatalogos } = require('./catalogos');
const { aplicarMigraciones } = require('../config/migraciones');
const { crearAdmin } = require('./createAdmin');
const { registrarMovimiento, obtenerMotivo, redondear } = require('../services/inventario');
const { aPlano } = require('../utils/auditoria');
const { hoy, sumarDias } = require('../utils/fechas');

const H = hoy();
const d = (n) => sumarDias(H, n);
const ts = (fecha, hora = '10:00') => new Date(`${fecha}T${hora}:00-06:00`);
const MARCA = 'HR-LP-007-2026';

(async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        await aplicarMigraciones();
        await sembrarCatalogos();
        const admin = await crearAdmin();
        if (await M.Contrato.findOne({ where: { numero_contrato: MARCA } })) {
            console.log('El historial de demostración ya está cargado; no se hizo nada.');
            process.exit(0);
        }

        await sequelize.transaction(async (t) => {
            const T = { transaction: t };
            const nombre = (modelo, valor) => modelo.findOne({ where: { nombre: valor }, ...T });
            const aud = (tabla, id, accion, usuario, fecha, { antes = null, despues = null, motivo = null } = {}) =>
                M.Auditoria.create({ tabla, id_registro: String(id), accion, datos_antes: aPlano(antes), datos_despues: aPlano(despues), id_usuario: usuario?.id_usuario ?? null, motivo, fecha }, T);

            // ---------- Usuarios de cada rol ----------
            const usuario = async (nom, ape, email, clave, rol) => (await M.Usuario.findOrCreate({
                where: { email }, defaults: { nombre: nom, apellido: ape, password: await bcrypt.hash(clave, 10), rol, activo: true }, ...T
            }))[0];
            const bodega = await usuario('Luis', 'Pérez', 'bodega@asiafarma.com', 'bodega123', 'bodeguero');
            const contratos = await usuario('Ana', 'López', 'contratos@asiafarma.com', 'contratos123', 'encargado_contratos');
            await usuario('Carlos', 'Méndez', 'gerencia@asiafarma.com', 'gerencia123', 'gerente');

            // ---------- Catálogos ----------
            const lab = async (n, pais) => (await M.Laboratorio.findOrCreate({ where: { nombre: n }, defaults: { pais }, ...T }))[0];
            const sanofi = await lab('Sanofi', 'Francia');
            const bonin = await lab('Laboratorios Bonin', 'Guatemala');
            const laprin = await lab('Laprin', 'Guatemala');
            const pisa = await lab('Laboratorios PiSA', 'México');

            const prov = async (n, nit, telefono, contacto) => (await M.Proveedor.findOrCreate({ where: { nit }, defaults: { nombre: n, telefono, contacto }, ...T }))[0];
            const centro = await prov('Distribuidora Farmacéutica Centroamericana, S.A.', '1234567-8', '2222-0000', 'Mario Castillo');
            const occidente = await prov('Comercializadora Médica de Occidente, S.A.', '4567890-1', '7761-2040', 'Sofía Ramírez');
            const valle = await prov('Farmacéutica del Valle, S.A.', '5678901-2', '2433-8810', 'Jorge Aldana');

            const forma = async (n) => (await nombre(M.FormaFarmaceutica, n)).id_forma_farmaceutica;
            const unidad = async (n) => (await nombre(M.UnidadMedida, n)).id_unidad_medida;
            const prod = async (codigo, n, f, concentracion, u, stock_minimo) => (await M.Producto.findOrCreate({
                where: { codigo }, defaults: { nombre: n, concentracion, stock_minimo, id_forma_farmaceutica: await forma(f), id_unidad_medida: await unidad(u) }, ...T
            }))[0];
            const cef = await prod('MED-010', 'Ceftriaxona', 'Polvo para reconstituir', '1 g', 'Vial', 300);
            const ome = await prod('MED-011', 'Omeprazol', 'Cápsula', '20 mg', 'Cápsula', 2000);
            const dic = await prod('MED-012', 'Diclofenaco sódico', 'Solución inyectable', '75 mg/3 ml', 'Ampolla', 500);
            const ssn = await prod('MED-013', 'Cloruro de sodio', 'Solución inyectable', '0.9% 500 ml', 'Frasco', 400);
            const met = await prod('MED-014', 'Metformina', 'Tableta', '850 mg', 'Tableta', 3000);
            const ibu = await prod('MED-015', 'Ibuprofeno', 'Tableta', '400 mg', 'Tableta', 1000);

            const tipo = async (n) => (await nombre(M.TipoInstitucion, n)).id_tipo_institucion;
            const inst = async (n, t2, departamento, nit, contacto, telefono, email) => {
                const [i] = await M.Institucion.findOrCreate({ where: { nombre: n }, defaults: { id_tipo_institucion: await tipo(t2), departamento, nit, contacto, telefono, email }, ...T });
                if (!i.contacto) await i.update({ contacto, telefono, email }, T);
                return i;
            };
            const roosevelt = await inst('Hospital Roosevelt', 'Hospital nacional', 'Guatemala', '2345678-9', 'Licda. Marta Girón (farmacia interna)', '2321-7400', 'farmacia@hospitalroosevelt.gob.gt');
            const zacapa = await inst('Hospital Regional de Zacapa', 'Hospital regional', 'Zacapa', '3344556-7', 'Lic. Pedro Orellana', '7941-0250', 'compras@hrzacapa.gob.gt');
            const igss = await inst('IGSS — Hospital General de Enfermedad Común', 'IGSS', 'Guatemala', '1122334-5', 'Licda. Rosa Herrera', '2412-1224', 'abastecimiento@igssgt.org');
            const jalapa = await inst('Dirección de Área de Salud de Jalapa', 'Dirección de Área de Salud', 'Jalapa', '9988776-5', 'Ing. Hugo Monterroso', '7922-4410', 'das.jalapa@mspas.gob.gt');

            const bodegaGeneral = (await nombre(M.Ubicacion, 'Bodega general')).id_ubicacion;
            const frio = (await nombre(M.Ubicacion, 'Cadena de frío')).id_ubicacion;
            const cuarentena = (await nombre(M.Ubicacion, 'Área de cuarentena')).id_ubicacion;
            const motivo = {};
            for (const c of ['COMPRA', 'DESPACHO', 'MERMA', 'DESTRUCCION', 'ANULACION_LOTE']) motivo[c] = await obtenerMotivo(c, t);

            const mover = async (lote, tipoMov, cantidad, mot, fecha, hora, extra = {}) => {
                const mov = await registrarMovimiento({ lote, tipo: tipoMov, cantidad, motivo: mot, id_usuario: (extra.usuario || bodega).id_usuario, observacion: extra.observacion, id_ingreso: extra.id_ingreso, id_pedido: extra.id_pedido, transaction: t });
                await mov.update({ fecha_movimiento: ts(fecha, hora) }, T);
                return mov;
            };

            // ---------- Compras ----------
            const L = {};
            const ingreso = async (proveedor, serie, numero, fecha, lineas) => {
                const ing = await M.Ingreso.create({
                    id_proveedor: proveedor.id_proveedor, serie_factura: serie, numero_factura: numero, fecha_factura: sumarDias(fecha, -1),
                    fecha_recepcion: fecha, id_usuario: bodega.id_usuario,
                    monto_total: redondear(lineas.reduce((s, l) => s + l.cantidad * l.costo, 0))
                }, T);
                for (const l of lineas) {
                    const lote = await M.Lote.create({
                        id_ingreso: ing.id_ingreso, id_producto: l.producto.id_producto, id_laboratorio: l.lab.id_laboratorio, numero_lote: l.numero,
                        fecha_fabricacion: l.fab, fecha_vencimiento: l.venc, cantidad_recibida: l.cantidad, cantidad_disponible: 0,
                        costo_unitario: l.costo, id_ubicacion: l.ubicacion || bodegaGeneral, condicion: 'disponible'
                    }, T);
                    await mover(lote, 'entrada', l.cantidad, motivo.COMPRA, fecha, '08:30', { id_ingreso: ing.id_ingreso, observacion: `Factura ${serie}-${numero}` });
                    await aud('lotes', lote.id_lote, 'crear', bodega, ts(fecha, '08:30'), { despues: lote });
                    L[l.clave || l.numero] = lote;
                }
                await aud('ingresos', ing.id_ingreso, 'crear', bodega, ts(fecha, '08:31'), { despues: ing });
                return ing;
            };

            // ---------- Contratos ----------
            const modalidad = async (n) => (await nombre(M.ModalidadCompra, n)).id_modalidad;
            const contrato = async (numero_contrato, nog, institucion, mod, inicio, fin, vigencia, renglones, estado = 'vigente') => {
                const c = await M.Contrato.create({
                    numero_contrato, nog, id_institucion: institucion.id_institucion, id_modalidad: await modalidad(mod), id_usuario: contratos.id_usuario,
                    fecha_inicio: inicio, fecha_fin: fin, vigencia_minima_meses: vigencia, estado,
                    monto_total: redondear(renglones.reduce((s, [, cant, precio]) => s + cant * precio, 0))
                }, T);
                c.renglones = {};
                for (const [i, [producto, cant, precio]] of renglones.entries()) {
                    c.renglones[producto.id_producto] = await M.DetalleContrato.create({
                        id_contrato: c.id_contrato, numero_renglon: i + 1, id_producto: producto.id_producto,
                        cantidad_contratada: cant, precio_unitario: precio, subtotal: redondear(cant * precio)
                    }, T);
                }
                await aud('contratos', c.id_contrato, 'crear', contratos, ts(inicio, '09:00'), { despues: c });
                return c;
            };

            // ---------- Pedidos ----------
            // lineas: [producto, cantidad, [[claveLote, cantidad], ...]]; etapas: { en_preparacion, empacado, en_transporte, entregado }
            const pedido = async (c, fecha_pedido, fecha_programada, lineas, etapas = {}, observaciones = null) => {
                const siguiente = (await M.Pedido.max('id_pedido', T) || 0) + 1;
                const estado = ['entregado', 'en_transporte', 'empacado', 'en_preparacion'].find(e => etapas[e]) || 'pendiente';
                const p = await M.Pedido.create({
                    id_contrato: c.id_contrato, id_usuario: contratos.id_usuario, numero_pedido: `PED-${fecha_pedido.slice(0, 4)}-${String(siguiente).padStart(5, '0')}`,
                    fecha_pedido, fecha_programada, fecha_real_entrega: etapas.entregado || null, estado, observaciones,
                    monto_total: redondear(lineas.reduce((s, [producto, cant]) => s + cant * Number(c.renglones[producto.id_producto].precio_unitario), 0))
                }, T);
                const seguir = (e, fecha, hora, quien, obs) => M.SeguimientoPedido.create({ id_pedido: p.id_pedido, estado: e, id_usuario: quien.id_usuario, observacion: obs, fecha: ts(fecha, hora) }, T);
                await seguir('pendiente', fecha_pedido, '09:15', contratos, 'Pedido registrado');
                for (const [producto, cant, lotes] of lineas) {
                    const renglon = c.renglones[producto.id_producto];
                    const det = await M.DetallePedido.create({
                        id_pedido: p.id_pedido, id_detalle_contrato: renglon.id_detalle_contrato, id_producto: producto.id_producto,
                        cantidad: cant, precio_unitario: renglon.precio_unitario, subtotal: redondear(cant * Number(renglon.precio_unitario))
                    }, T);
                    if (!etapas.en_preparacion) continue;
                    for (const [clave, n] of lotes) {
                        await M.AsignacionLote.create({ id_detalle_pedido: det.id_detalle_pedido, id_lote: L[clave].id_lote, cantidad: n }, T);
                        await mover(L[clave], 'salida', n, motivo.DESPACHO, etapas.en_preparacion, '10:30', {
                            id_pedido: p.id_pedido, observacion: `${p.numero_pedido} · Contrato ${c.numero_contrato}`
                        });
                    }
                }
                if (etapas.en_preparacion) await seguir('en_preparacion', etapas.en_preparacion, '10:30', bodega, 'Lotes asignados por FEFO');
                if (etapas.empacado) await seguir('empacado', etapas.empacado, '11:45', bodega, null);
                if (etapas.en_transporte) await seguir('en_transporte', etapas.en_transporte, '13:00', bodega, 'Transporte propio, guía de envío adjunta');
                if (etapas.entregado) await seguir('entregado', etapas.entregado, '15:30', contratos, 'Recibido conforme por farmacia de la institución');
                await aud('pedidos', p.id_pedido, 'crear', contratos, ts(fecha_pedido, '09:15'), { despues: p });
                return p;
            };

            const cambiarCondicion = async (lote, condicion, fecha, quien, motivoTexto, extra = {}) => {
                const antes = aPlano(lote);
                await lote.update({ condicion, motivo_condicion: motivoTexto, ...extra }, T);
                await aud('lotes', lote.id_lote, 'cambio_estado', quien, ts(fecha, '16:00'), { antes, despues: lote, motivo: motivoTexto });
            };

            // ================= Historia en orden cronológico =================
            await ingreso(valle, 'FV', '1120', d(-420), [
                { producto: met, lab: bonin, numero: 'BN-M330', fab: d(-500), venc: d(-20), cantidad: 3000, costo: 0.30 },
                { producto: ssn, lab: pisa, numero: 'PS-S7712', fab: d(-450), venc: d(200), cantidad: 2500, costo: 6.00 }
            ]);
            const cIgss = await contrato('IGSS-CA-118-2025', '21554870', igss, 'Contrato abierto', d(-400), d(-30), 6,
                [[ome, 6000, 0.95], [ssn, 800, 11.50]], 'completado');
            const cJalapa = await contrato('DASJ-BC-044-2025', '20981123', jalapa, 'Baja cuantía', d(-330), d(-15), 6,
                [[ibu, 3000, 0.60], [met, 2000, 0.75], [dic, 600, 3.90]], 'vencido');
            await ingreso(centro, 'A', '0890', d(-320), [
                { producto: dic, lab: laprin, numero: 'LP-D0457', fab: d(-600), venc: d(75), cantidad: 2000, costo: 1.80 },
                { producto: ibu, lab: laprin, numero: 'LP-I2210', fab: d(-420), venc: d(150), cantidad: 4000, costo: 0.25 }
            ]);
            await pedido(cJalapa, d(-300), d(-290), [[ibu, 1500, [['LP-I2210', 1500]]], [met, 1000, [['BN-M330', 1000]]], [dic, 300, [['LP-D0457', 300]]]],
                { en_preparacion: d(-293), empacado: d(-292), en_transporte: d(-286), entregado: d(-284) }, 'Primera entrega del contrato');
            await ingreso(occidente, 'B', '3301', d(-240), [
                { producto: cef, lab: sanofi, numero: 'SN-C2231', fab: d(-300), venc: d(500), cantidad: 2000, costo: 14.50 },
                { producto: ome, lab: bonin, numero: 'BN-O118', fab: d(-260), venc: d(420), cantidad: 20000, costo: 0.45 }
            ]);
            await pedido(cIgss, d(-230), d(-220), [[ome, 3000, [['BN-O118', 3000]]], [ssn, 400, [['PS-S7712', 400]]]],
                { en_preparacion: d(-224), empacado: d(-223), en_transporte: d(-222), entregado: d(-221) });
            const cRoosevelt = await contrato(MARCA, '22109876', roosevelt, 'Licitación pública', d(-200), d(80), 6,
                [[cef, 2500, 26.00], [dic, 3000, 3.75], [ssn, 2000, 11.00], [ome, 10000, 0.90]]);
            await pedido(cRoosevelt, d(-190), d(-180), [[cef, 500, [['SN-C2231', 500]]], [ome, 4000, [['BN-O118', 4000]]], [ssn, 500, [['PS-S7712', 500]]]],
                { en_preparacion: d(-184), empacado: d(-183), en_transporte: d(-181), entregado: d(-180) });
            const cZacapa = await contrato('HRZ-COT-031-2026', '22340551', zacapa, 'Cotización', d(-150), d(12), null,
                [[cef, 1000, 25.50], [ibu, 2000, 0.58], [ssn, 600, 11.80]]);
            await pedido(cZacapa, d(-140), d(-130), [[cef, 400, [['SN-C2231', 400]]], [ssn, 300, [['PS-S7712', 300]]]],
                { en_preparacion: d(-134), empacado: d(-133), en_transporte: d(-131), entregado: d(-130) });

            // Caso 3: el vencimiento de SN-C2410 se digitó mal y un administrador lo corrige después
            await ingreso(centro, 'A', '0951', d(-120), [
                { producto: cef, lab: sanofi, numero: 'SN-C2410', fab: d(-150), venc: d(985), cantidad: 1200, costo: 14.20, ubicacion: frio },
                { producto: dic, lab: laprin, numero: 'LP-D0612', fab: d(-130), venc: d(600), cantidad: 2500, costo: 1.75 },
                { producto: met, lab: bonin, numero: 'BN-M412', fab: d(-140), venc: d(560), cantidad: 1500, costo: 0.30 }
            ]);
            await pedido(cJalapa, d(-110), d(-100), [[ibu, 1000, [['LP-I2210', 1000]]], [met, 800, [['BN-M412', 800]]]],
                { en_preparacion: d(-104), empacado: d(-103), en_transporte: d(-99), entregado: d(-98) });
            {
                const lote = L['SN-C2410'];
                const antes = aPlano(lote);
                await lote.update({ fecha_vencimiento: d(620) }, T);
                await aud('lotes', lote.id_lote, 'editar', admin, ts(d(-105), '11:20'), { antes, despues: lote, motivo: 'Error de digitación: el empaque indica un vencimiento un año antes del registrado.' });
            }
            await pedido(cIgss, d(-100), d(-90), [[ome, 3000, [['BN-O118', 3000]]], [ssn, 400, [['PS-S7712', 400]]]],
                { en_preparacion: d(-94), empacado: d(-93), en_transporte: d(-91), entregado: d(-90) });
            await aud('contratos', cIgss.id_contrato, 'cambio_estado', contratos, ts(d(-90), '15:31'), { despues: cIgss, motivo: 'Todos los renglones fueron entregados' });
            await pedido(cRoosevelt, d(-80), d(-70), [[cef, 400, [['SN-C2231', 400]]], [dic, 1000, [['LP-D0612', 1000]]], [ssn, 600, [['PS-S7712', 600]]]],
                { en_preparacion: d(-72), empacado: d(-71), en_transporte: d(-67), entregado: d(-66) }, 'El transporte se retrasó por un desperfecto mecánico');
            await ingreso(valle, 'FV', '1187', d(-60), [
                { producto: ssn, lab: pisa, numero: 'PS-S7790', fab: d(-90), venc: d(700), cantidad: 3000, costo: 5.80 },
                { producto: ome, lab: bonin, numero: 'BN-O205', fab: d(-80), venc: d(640), cantidad: 15000, costo: 0.44 }
            ]);
            await mover(L['PS-S7712'], 'salida', 20, motivo.MERMA, d(-40), '14:10', { observacion: 'Frascos rotos al reacomodar la estantería' });
            await aud('lotes', L['PS-S7712'].id_lote, 'ajuste_inventario', bodega, ts(d(-40), '14:10'), { despues: L['PS-S7712'], motivo: 'Merma o daño: frascos rotos al reacomodar la estantería' });

            // Caso 9: el mismo lote de suero se volvió a cargar en otra factura y se anula
            await ingreso(occidente, 'B', '3378', d(-25), [
                { producto: ibu, lab: laprin, numero: 'LP-I2388', fab: d(-60), venc: d(700), cantidad: 6000, costo: 0.24 },
                { producto: ssn, lab: pisa, numero: 'PS-S7790', clave: 'DUPLICADO', fab: d(-90), venc: d(700), cantidad: 3000, costo: 5.80 }
            ]);
            {
                const lote = L.DUPLICADO;
                const antes = aPlano(lote);
                const texto = 'Lote registrado dos veces: ya había ingresado con la factura FV-1187.';
                await mover(lote, 'salida', 3000, motivo.ANULACION_LOTE, d(-24), '09:05', { usuario: admin, id_ingreso: lote.id_ingreso, observacion: texto });
                await lote.update({ condicion: 'anulado', motivo_condicion: texto }, T);
                await aud('lotes', lote.id_lote, 'anular', admin, ts(d(-24), '09:05'), { antes, despues: lote, motivo: texto });
            }

            // El lote de metformina BN-M330 venció y se destruye una parte
            await cambiarCondicion(L['BN-M330'], 'vencido', d(-19), null, 'Vencimiento automático por fecha');
            await mover(L['BN-M330'], 'salida', 1200, motivo.DESTRUCCION, d(-10), '10:00', { observacion: 'Acta de destrucción 014-2026 con supervisión del MSPAS' });
            await aud('lotes', L['BN-M330'].id_lote, 'ajuste_inventario', bodega, ts(d(-10), '10:00'), { despues: L['BN-M330'], motivo: 'Destrucción por vencimiento: acta 014-2026' });

            // Pedidos en curso: uno retrasado (programado hace 3 días), uno en camino y dos por preparar
            await pedido(cRoosevelt, d(-12), d(-3), [[cef, 300, [['SN-C2231', 300]]], [dic, 500, [['LP-D0612', 500]]]],
                { en_preparacion: d(-10), empacado: d(-4) }, 'Esperando transporte disponible');
            await pedido(cZacapa, d(-8), d(1), [[cef, 300, [['SN-C2231', 300]]], [ssn, 200, [['PS-S7790', 200]]]],
                { en_preparacion: d(-6), empacado: d(-6), en_transporte: d(-1) });
            await pedido(cRoosevelt, d(-2), d(2), [[ome, 2000], [ssn, 300]]);
            await pedido(cRoosevelt, d(-1), d(20), [[cef, 200]]);

            // Retenciones: reclamo de calidad (cuarentena) y retiro del mercado (bloqueado)
            await cambiarCondicion(L['BN-O205'], 'cuarentena', d(-5), bodega, 'Reclamo de calidad: cápsulas adheridas en varios blísteres. Se espera dictamen del laboratorio.', { id_ubicacion: cuarentena });
            await cambiarCondicion(L['SN-C2231'], 'bloqueado', d(-3), admin, 'Retiro voluntario del lote notificado por Sanofi (alerta sanitaria). Avisar a las instituciones que lo recibieron.');
        });

        console.log('Historial de demostración cargado.');
        console.log('Usuarios: bodega@asiafarma.com / bodega123 · contratos@asiafarma.com / contratos123 · gerencia@asiafarma.com / gerencia123');
        process.exit(0);
    } catch (error) {
        console.error('Error al cargar el historial:', error.message);
        process.exit(1);
    }
})();
