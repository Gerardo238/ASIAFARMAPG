// BORRA TODA LA BASE DE DATOS y la vuelve a crear con el modelo actual,
// los catálogos base y el administrador inicial. Solo para desarrollo.
// Uso: npm run db:reset -- --confirmar
require('dotenv').config();
const sequelize = require('../config/database');
require('../models/index');
const { sembrarCatalogos } = require('./catalogos');
const { crearAdmin } = require('./createAdmin');

(async () => {
    if (!process.argv.includes('--confirmar')) {
        console.error(`Esto borra TODOS los datos de la base "${process.env.DB_NAME}". Ejecuta: npm run db:reset -- --confirmar`);
        process.exit(1);
    }
    try {
        await sequelize.authenticate();
        await sequelize.getQueryInterface().dropAllTables();
        await sequelize.getQueryInterface().dropAllEnums();
        await sequelize.sync({ force: true });
        await sembrarCatalogos();
        const admin = await crearAdmin();
        console.log(`Base de datos recreada. Administrador: ${admin.email}`);
        process.exit(0);
    } catch (error) {
        console.error('Error al recrear la base de datos:', error.message);
        process.exit(1);
    }
})();
