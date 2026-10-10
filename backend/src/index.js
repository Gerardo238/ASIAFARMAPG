const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/database');
const models = require('./models/index');

// Rutas
const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const loteRoutes = require('./routes/loteRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const institucionRoutes = require('./routes/institucionRoutes');
const contratoRoutes = require('./routes/contratoRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ mensaje: 'API ASIAFARMA funcionando correctamente' });
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/lotes', loteRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/instituciones', institucionRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/pedidos', pedidoRoutes);

sequelize.authenticate()
    .then(() => {
        console.log('Conexión a la base de datos exitosa');
        return sequelize.sync({ alter: true });
    })
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error al conectar la base de datos:', error);
    });