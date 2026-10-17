// Actualiza el sistema a la última versión de GitHub.
// Uso (en la carpeta backend):  npm run actualizar
//
// 1. Descarta cambios hechos a mano en los archivos del proyecto (la
//    contraseña propia va en backend/.env.local, que no se toca).
// 2. Descarga la última versión (git pull).
// 3. Instala lo que haga falta en backend y frontend (npm install).
// La base de datos se actualiza sola la próxima vez que arranque el backend.
const { execSync } = require('child_process');
const path = require('path');

const raiz = path.join(__dirname, '..', '..');
const correr = (titulo, comando, carpeta = raiz) => {
    console.log(`\n>> ${titulo}`);
    execSync(comando, { cwd: carpeta, stdio: 'inherit' });
};

try {
    correr('Descartando cambios locales en los archivos del proyecto...', 'git checkout -- .');
    correr('Descargando la última versión de GitHub...', 'git pull');
    correr('Instalando dependencias del backend...', 'npm install --no-audit --no-fund', path.join(raiz, 'backend'));
    correr('Instalando dependencias del frontend...', 'npm install --no-audit --no-fund', path.join(raiz, 'frontend'));
    console.log('\nListo. Arranca el sistema con arrancar-sistema.bat (o "npm run dev" en backend y en frontend).');
} catch {
    console.error('\nNo se pudo actualizar. Revisa que haya internet y que Git esté instalado, y vuelve a intentar.');
    process.exit(1);
}
