// Carga la configuración. backend/.env.local (no se sube a GitHub) tiene
// prioridad sobre backend/.env: ahí cada computadora pone su propia
// contraseña de PostgreSQL sin que choque al actualizar con "npm run actualizar".
const path = require('path');

require('dotenv').config({
    path: [path.join(__dirname, '../../.env.local'), path.join(__dirname, '../../.env')],
    quiet: true
});
