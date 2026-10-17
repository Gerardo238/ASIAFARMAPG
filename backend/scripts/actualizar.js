// Actualiza el sistema a la última versión de GitHub.
// Uso (en la carpeta backend):  npm run actualizar
//
// 1. Descarga la última versión y deja los archivos igual a GitHub,
//    descartando cambios hechos a mano (la configuración propia va en
//    backend/.env.local, que no se toca).
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
    correr('Descargando la última versión de GitHub...', 'git fetch origin');
    // Deja los archivos igual a GitHub aunque se hayan cambiado a mano o copiado sueltos
    correr('Aplicando la última versión...', 'git reset --hard @{u}');
    correr('Instalando dependencias del backend...', 'npm install --no-audit --no-fund', path.join(raiz, 'backend'));
    correr('Instalando dependencias del frontend...', 'npm install --no-audit --no-fund', path.join(raiz, 'frontend'));
    console.log('\nListo. Arranca el sistema con arrancar-sistema.bat (o "npm run dev" en backend y en frontend).');
} catch {
    console.error('\nNo se pudo actualizar. Revisa que haya internet y que Git esté instalado, y vuelve a intentar.');
    process.exit(1);
}
