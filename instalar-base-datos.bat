@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
title ASIAFARMA - Instalar base de datos

echo ============================================================
echo   ASIAFARMA - Crear la base de datos con todos sus datos
echo ============================================================
echo.

REM ---- Datos de conexion -----------------------------------------------------
REM Valores por defecto; si este archivo esta en la carpeta del proyecto,
REM se usan los de backend\.env
set "DB_HOST=localhost"
set "DB_PORT=5432"
set "DB_NAME=ASIAFARMA"
set "DB_USER=u_asiafarma"
set "DB_PASSWORD=asiafarma2026"
set "PORT=3000"
if exist "backend\.env" (
    for /f "usebackq eol=# tokens=1,* delims==" %%a in ("backend\.env") do set "%%a=%%b"
)
REM backend\.env.local (la contrasena propia de esta computadora) tiene prioridad
if exist "backend\.env.local" (
    for /f "usebackq eol=# tokens=1,* delims==" %%a in ("backend\.env.local") do set "%%a=%%b"
)

REM ---- El SQL va en la misma carpeta que este archivo -----------------------
set "SQL=%~dp0asiafarma.sql"
if not exist "%SQL%" (
    echo ERROR: no se encontro asiafarma.sql en la misma carpeta que este archivo:
    echo     %~dp0
    goto :fin_error
)

REM ---- Buscar psql (PATH o carpeta de instalacion de PostgreSQL) ----------
set "PSQL="
for /f "delims=" %%p in ('where psql 2^>nul') do if not defined PSQL set "PSQL=%%p"
if not defined PSQL (
    for /d %%d in ("%ProgramFiles%\PostgreSQL\*") do if exist "%%d\bin\psql.exe" set "PSQL=%%d\bin\psql.exe"
)
if not defined PSQL (
    echo ERROR: no se encontro psql.exe. Instala PostgreSQL o agrega su carpeta bin al PATH.
    goto :fin_error
)

echo Servidor : %DB_HOST%:%DB_PORT%
echo Base     : %DB_NAME%
echo Usuario  : %DB_USER%
echo Archivo  : %SQL%
echo.
echo ATENCION: se BORRARA todo lo que hay en la base "%DB_NAME%"
echo y se cargaran las tablas, los datos y los documentos de ASIAFARMA.
echo.
set /p "RESP=Escribe SI para continuar: "
if /i not "%RESP%"=="SI" (
    echo Cancelado. No se modifico nada.
    goto :fin
)

REM ---- Cargar el SQL en una sola transaccion (si algo falla, no cambia nada)
echo.
echo Cargando la base de datos...
set "PGPASSWORD=%DB_PASSWORD%"
set "PGCLIENTENCODING=UTF8"
"%PSQL%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d "%DB_NAME%" -v ON_ERROR_STOP=1 --single-transaction -q -o NUL -f "%SQL%"
if errorlevel 1 (
    echo.
    echo ERROR: no se pudo cargar la base. No se cambio nada.
    echo Revisa que la base "%DB_NAME%" exista, que la contrasena sea correcta y que
    echo el usuario tenga permisos. Como superusuario postgres puedes darlos con:
    echo     ALTER DATABASE "%DB_NAME%" OWNER TO %DB_USER%;
    echo     \c "%DB_NAME%"
    echo     ALTER SCHEMA public OWNER TO %DB_USER%;
    goto :fin_error
)
echo Base de datos cargada.

REM ---- Si esta en la carpeta del proyecto: frontend y dependencias ---------
if not exist "frontend\" goto :resumen
> "frontend\.env.local" echo VITE_API_URL=http://localhost:%PORT%/api
echo Frontend configurado para usar el backend en http://localhost:%PORT%/api

where npm >nul 2>nul
if errorlevel 1 (
    echo.
    echo Aviso: no se encontro npm. Instala Node.js para correr el sistema.
    goto :resumen
)
if not exist "backend\node_modules" (
    echo Instalando dependencias del backend...
    pushd backend & call npm install --no-audit --no-fund & popd
)
if not exist "frontend\node_modules" (
    echo Instalando dependencias del frontend...
    pushd frontend & call npm install --no-audit --no-fund & popd
)

:resumen
echo.
echo ============================================================
echo   Listo. Para arrancar el sistema:
echo     1. En backend :  npm run dev
echo     2. En frontend:  npm run dev   y abrir la direccion que muestre
echo.
echo   Usuarios:
echo     admin@asiafarma.com      / admin123      (Administrador)
echo     bodega@asiafarma.com     / bodega123     (Bodeguero)
echo     contratos@asiafarma.com  / contratos123  (Encargado de contratos)
echo     gerencia@asiafarma.com   / gerencia123   (Gerente)
echo ============================================================
goto :fin

:fin_error
echo.
pause
exit /b 1

:fin
echo.
pause
exit /b 0
