@echo off
cd /d "%~dp0"
title ASIAFARMA

echo Arrancando ASIAFARMA...

start "ASIAFARMA - Backend" /d "%~dp0backend" cmd /k npm run dev
start "ASIAFARMA - Frontend" /d "%~dp0frontend" cmd /k npm run dev -- --port 5174

REM Espera a que el sistema responda y abre el navegador
for /l %%i in (1,1,30) do (
    curl -s -o nul http://localhost:5174 && goto :abrir
    ping -n 2 127.0.0.1 >nul
)
:abrir
start "" http://localhost:5174
