@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
title ASIAFARMA - Borrar datos

echo ============================================================
echo   ASIAFARMA - Borrar los datos de la base
echo ============================================================
echo.
echo Se BORRAN: contratos y sus tramites (prorrogas, notas tecnicas, oficios),
echo pedidos con su seguimiento y devoluciones, ingresos, lotes, movimientos,
echo asignaciones de lote, adjuntos, auditoria, productos, instituciones,
echo proveedores y laboratorios.
echo.
echo Se CONSERVAN: usuarios (para poder entrar), parametros y catalogos
echo (formas farmaceuticas, unidades de medida, modalidades de compra,
echo motivos de movimiento, tipos de institucion y ubicaciones).
echo.
echo Antes de borrar se hace un respaldo completo en la carpeta respaldos\.
echo.

REM ---- Datos de conexion (de backend\.env) --------------------------------------
set "DB_HOST=localhost"
set "DB_PORT=5432"
set "DB_NAME=ASIAFARMA"
set "DB_USER=postgres"
set "DB_PASSWORD="
if exist "backend\.env" (
    for /f "usebackq eol=# tokens=1,* delims==" %%a in ("backend\.env") do set "%%a=%%b"
)
if exist "backend\.env.local" (
    for /f "usebackq eol=# tokens=1,* delims==" %%a in ("backend\.env.local") do set "%%a=%%b"
)
set "PGPASSWORD=%DB_PASSWORD%"

REM ---- Buscar psql y pg_dump --------------------------------------------------------
set "PGBIN="
for /f "delims=" %%p in ('where psql 2^>nul') do if not defined PGBIN set "PGBIN=%%~dpp"
if not defined PGBIN (
    for /d %%d in ("%ProgramFiles%\PostgreSQL\*") do if exist "%%d\bin\psql.exe" set "PGBIN=%%d\bin\"
)
if not defined PGBIN (
    echo ERROR: no se encontro psql.exe. Instala PostgreSQL o agrega su carpeta bin al PATH.
    goto :fin_error
)

echo Base de datos: %DB_NAME% en %DB_HOST%:%DB_PORT% (usuario %DB_USER%)
echo.
set /p "OK=Escribe BORRAR (en mayusculas) para continuar: "
if not "%OK%"=="BORRAR" (
    echo Cancelado. No se borro nada.
    goto :fin
)

REM ---- Respaldo ---------------------------------------------------------------------
if not exist "respaldos" mkdir "respaldos"
for /f %%t in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HHmm"') do set "FECHA=%%t"
set "RESPALDO=respaldos\ASIAFARMA_antes_de_borrar_%FECHA%.sql"
echo.
echo Respaldando en %RESPALDO% ...
"%PGBIN%pg_dump.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%RESPALDO%"
if errorlevel 1 (
    echo ERROR: no se pudo hacer el respaldo. No se borro nada.
    goto :fin_error
)

REM ---- Borrado (todo o nada, en una transaccion) ----------------------------------
REM CASCADE vacia tambien las tablas que dependen de estas (tramites_contrato,
REM devoluciones_pedido, detalle_devoluciones), aunque la base sea anterior a ellas.
echo Borrando datos ...
"%PGBIN%psql.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -v ON_ERROR_STOP=1 -q -c ^
 "BEGIN; TRUNCATE TABLE asignaciones_lote, movimientos, seguimiento_pedidos, detalle_pedidos, pedidos, detalle_contratos, contratos, lotes, ingresos, adjuntos, auditoria, productos, instituciones, proveedores, laboratorios RESTART IDENTITY CASCADE; COMMIT;"
if errorlevel 1 (
    echo ERROR: no se pudo borrar. La base quedo como estaba.
    goto :fin_error
)

echo.
echo Listo. Datos borrados; los numeros (id) empiezan otra vez en 1.
echo Si necesitas recuperar lo borrado, el respaldo esta en:
echo     %RESPALDO%
goto :fin

:fin_error
echo.
pause
exit /b 1

:fin
echo.
pause
exit /b 0
