// Datos de demostración cargados a través de la API (con el servidor
// corriendo), para probar el flujo completo: compras con lotes de distintos
// laboratorios, contrato de GUATECOMPRAS y un pedido que se despacha por FEFO.
// Uso: npm run seed:demo
require('dotenv').config();
const { hoy, sumarMeses, sumarDias } = require('../utils/fechas');

const API = `http://localhost:${process.env.PORT}/api`;
let token;

const llamar = async (metodo, ruta, cuerpo) => {
    const res = await fetch(API + ruta, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });
    const datos = await res.json();
    if (!res.ok) throw new Error(`${metodo} ${ruta}: ${datos.mensaje}${datos.detalle ? ' — ' + JSON.stringify(datos.detalle) : ''}`);
    return datos;
};

const porNombre = (lista, nombre) => lista.find(x => x.nombre === nombre);

(async () => {
    try {
        token = (await llamar('POST', '/auth/login', { email: 'admin@asiafarma.com', password: 'admin123' })).token;
        const H = hoy();

        const [formas, unidades, ubicaciones, tipos, modalidades] = await Promise.all([
            llamar('GET', '/catalogos/formas-farmaceuticas'), llamar('GET', '/catalogos/unidades-medida'),
            llamar('GET', '/catalogos/ubicaciones'), llamar('GET', '/catalogos/tipos-institucion'),
            llamar('GET', '/catalogos/modalidades-compra')
        ]);
        const bodega = porNombre(ubicaciones, 'Bodega general').id_ubicacion;

        const lab = async (nombre, pais) => (await llamar('POST', '/catalogos/laboratorios', { nombre, pais })).registro;
        const bayer = await lab('Bayer', 'Alemania');
        const mk = await lab('MK (Tecnoquímicas)', 'Colombia');
        const pisa = await lab('Laboratorios PiSA', 'México');

        const prov = async (nombre, nit) => (await llamar('POST', '/catalogos/proveedores', { nombre, nit, telefono: '2222-0000' })).registro;
        const dist1 = await prov('Distribuidora Farmacéutica Centroamericana, S.A.', '1234567-8');
        const dist2 = await prov('Droguería Nacional, S.A.', '7654321-0');

        const prod = async (codigo, nombre, forma, concentracion, unidad, stock_minimo) => (await llamar('POST', '/productos', {
            codigo, nombre, concentracion, stock_minimo,
            id_forma_farmaceutica: porNombre(formas, forma).id_forma_farmaceutica,
            id_unidad_medida: porNombre(unidades, unidad).id_unidad_medida
        })).producto;
        const lido = await prod('MED-001', 'Lidocaína', 'Solución inyectable', '2%', 'Vial', 200);
        const amox = await prod('MED-002', 'Amoxicilina', 'Cápsula', '500 mg', 'Cápsula', 1000);
        const acet = await prod('MED-003', 'Acetaminofén', 'Tableta', '500 mg', 'Tableta', 2000);
        const gasa = await prod('MQ-001', 'Gasa estéril', 'Material médico quirúrgico', '10 x 10 cm', 'Unidad', 500);

        const lote = (producto, laboratorio, numero_lote, mesesVence, cantidad, costo) => ({
            id_producto: producto.id_producto, id_laboratorio: laboratorio.id_laboratorio, numero_lote,
            fecha_fabricacion: sumarMeses(H, -3), fecha_vencimiento: sumarMeses(H, mesesVence),
            cantidad, costo_unitario: costo, id_ubicacion: bodega
        });

        // Tres compras de lidocaína con lotes, laboratorios y vencimientos distintos
        await llamar('POST', '/ingresos', {
            id_proveedor: dist1.id_proveedor, serie_factura: 'A', numero_factura: '1001',
            fecha_factura: sumarDias(H, -20), fecha_recepcion: sumarDias(H, -19),
            lotes: [lote(lido, bayer, 'BY24-001', 14, 200, 8.5), lote(amox, pisa, 'PS-7781', 24, 5000, 0.35)]
        });
        await llamar('POST', '/ingresos', {
            id_proveedor: dist2.id_proveedor, serie_factura: 'FAC', numero_factura: '55890',
            fecha_factura: sumarDias(H, -10), fecha_recepcion: sumarDias(H, -10),
            lotes: [lote(lido, mk, 'MK-L2290', 30, 300, 7.9), lote(acet, pisa, 'PS-1203', 36, 10000, 0.12)]
        });
        await llamar('POST', '/ingresos', {
            id_proveedor: dist1.id_proveedor, serie_factura: 'A', numero_factura: '1042',
            fecha_factura: sumarDias(H, -2), fecha_recepcion: sumarDias(H, -1),
            lotes: [lote(lido, bayer, 'BY24-118', 20, 150, 8.5), lote(gasa, mk, 'MK-G100', 48, 3000, 0.9)]
        });

        const inst = async (nombre, tipo, departamento, nit) => (await llamar('POST', '/instituciones', {
            nombre, departamento, nit, id_tipo_institucion: porNombre(tipos, tipo).id_tipo_institucion
        })).registro;
        const chiquimula = await inst('Hospital Nacional de Chiquimula', 'Hospital nacional', 'Chiquimula', '3456789-1');
        const roosevelt = await inst('Hospital Roosevelt', 'Hospital nacional', 'Guatemala', '2345678-9');

        const contrato = (await llamar('POST', '/contratos', {
            numero_contrato: 'HNCH-012-2026', nog: '21458796', id_institucion: chiquimula.id_institucion,
            id_modalidad: porNombre(modalidades, 'Cotización').id_modalidad,
            fecha_inicio: sumarDias(H, -30), fecha_fin: sumarMeses(H, 6), vigencia_minima_meses: 12,
            renglones: [
                { id_producto: lido.id_producto, cantidad_contratada: 600, precio_unitario: 12.5 },
                { id_producto: amox.id_producto, cantidad_contratada: 3000, precio_unitario: 0.6 },
                { id_producto: gasa.id_producto, cantidad_contratada: 1000, precio_unitario: 1.4 }
            ]
        })).contrato;
        await llamar('POST', '/contratos', {
            numero_contrato: 'HR-088-2026', nog: '21503344', id_institucion: roosevelt.id_institucion,
            id_modalidad: porNombre(modalidades, 'Contrato abierto').id_modalidad,
            fecha_inicio: sumarDias(H, -60), fecha_fin: sumarDias(H, 20), vigencia_minima_meses: 12,
            renglones: [{ id_producto: acet.id_producto, cantidad_contratada: 8000, precio_unitario: 0.25 }]
        });

        const detalle = await llamar('GET', `/contratos/${contrato.id_contrato}`);
        const renglonLido = detalle.renglones.find(r => r.id_producto === lido.id_producto);
        const pedido = (await llamar('POST', '/pedidos', {
            id_contrato: contrato.id_contrato, fecha_programada: sumarDias(H, 5),
            detalles: [{ id_detalle_contrato: renglonLido.id_detalle_contrato, cantidad: 300 }]
        })).pedido;

        console.log('Datos de demostración cargados.');
        console.log(`Pedido ${pedido.numero_pedido}: 300 viales de lidocaína para el Hospital Nacional de Chiquimula (pendiente de preparar).`);
        process.exit(0);
    } catch (error) {
        console.error('Error al cargar la demostración:', error.message);
        process.exit(1);
    }
})();
