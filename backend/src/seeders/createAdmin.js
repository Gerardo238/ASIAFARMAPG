require('../config/entorno');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { Usuario } = require('../models/index');

const EMAIL_ADMIN = 'admin@asiafarma.com';

// Crea el administrador inicial si todavía no existe
const crearAdmin = async () => {
    const existente = await Usuario.findOne({ where: { email: EMAIL_ADMIN } });
    if (existente) return existente;
    return Usuario.create({
        nombre: 'Gerardo',
        apellido: 'García',
        email: EMAIL_ADMIN,
        password: await bcrypt.hash('admin123', 10),
        rol: 'administrador',
        activo: true
    });
};

if (require.main === module) {
    (async () => {
        try {
            await sequelize.authenticate();
            await sequelize.sync();
            const admin = await crearAdmin();
            console.log('Usuario administrador listo:', admin.email);
            process.exit(0);
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = { crearAdmin };
