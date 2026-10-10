require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { Usuario } = require('../models/index');

const crearAdmin = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        const passwordHash = await bcrypt.hash('admin123', 10);

        const admin = await Usuario.create({
            nombre: 'Gerardo',
            apellido: 'García',
            email: 'admin@asiafarma.com',
            password: passwordHash,
            rol: 'administrador',
            activo: true
        });

        console.log('Usuario administrador creado exitosamente:', admin.email);
        process.exit(0);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

crearAdmin();