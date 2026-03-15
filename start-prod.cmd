@echo off
setlocal
cd /d "%~dp0"

if not exist node_modules (
  call npm install
  if errorlevel 1 exit /b %errorlevel%
)

if not exist public\data\dublin-postal-areas.geojson (
  call npm run fetch:districts
  if errorlevel 1 exit /b %errorlevel%
)

call npm run build
if errorlevel 1 exit /b %errorlevel%

call npm run preview:open
