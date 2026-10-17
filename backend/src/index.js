const express = require('express');
const cors = require('cors');
require('./config/entorno');
const sequelize = require('./config/database');
require('./models/index');
const { aplicarMigraciones } = require('./config/migraciones');
const { sembrarCatalogos } = require('./seeders/catalogos');
const { programarVencimientos } = require('./services/vencimientos');

// Rutas
const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const ingresoRoutes = require('./routes/ingresoRoutes');
const loteRoutes = require('./routes/loteRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const institucionRoutes = require('./routes/institucionRoutes');
const contratoRoutes = require('./routes/contratoRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const catalogoRoutes = require('./routes/catalogoRoutes');
const consultaRoutes = require('./routes/consultaRoutes');
const adjuntoRoutes = require('./routes/adjuntoRoutes');
const tramiteRoutes = require('./routes/tramiteRoutes');

const app = express();

app.use(cors());
// 15 MB: los adjuntos (foto o PDF de la factura) viajan en base64 dentro del JSON
app.use(express.json({ limit: '15mb' }));

app.get('/', (req, res) => {
    res.json({ mensaje: 'API ASIAFARMA funcionando correctamente' });
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/ingresos', ingresoRoutes);
app.use('/api/lotes', loteRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/instituciones', institucionRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/adjuntos', adjuntoRoutes);
app.use('/api/tramites', tramiteRoutes);
app.use('/api', consultaRoutes);

// sync() crea las tablas que falten sin tocar las existentes.
// Con DB_SYNC=alter en el .env también ajusta columnas (solo en desarrollo);
// para recrear la base desde cero usa "npm run db:reset".
sequelize.authenticate()
    .then(() => {
        console.log('Conexión a la base de datos exitosa');
        return sequelize.sync(process.env.DB_SYNC === 'alter' ? { alter: true } : {});
    })
    .then(() => aplicarMigraciones())
    .then(() => sembrarCatalogos())
    .then(() => {
        programarVencimientos();
        app.listen(process.env.PORT, () => {
            console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error al conectar la base de datos:', error);
    });
