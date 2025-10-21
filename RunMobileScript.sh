#!/bin/bash
echo "--- INICIANDO DESPLIEGUE MÓVIL (CAPACITOR) ---"

# Paso 1: Instalación de dependencias de Node
echo "1. Instalando dependencias de Node.js (React y utilidades)..."
npm install --legacy-peer-deps

# Paso 2: Compilación de la aplicación React a HTML/CSS/JS (carpeta 'build')
echo "2. Compilando la aplicación web de React..."
npm run build

# Paso 3: Inicialización de Capacitor (Contenedor Móvil)
echo "3. Inicializando Capacitor..."
npm install @capacitor/core @capacitor/cli @capacitor/android

# Paso 4: Agregar la plataforma Android
echo "4. Añadiendo plataforma Android..."
npx cap add android

# Paso 5: Copiar archivos web a la estructura Android
echo "5. Copiando los archivos compilados a la carpeta de Android..."
npx cap copy android

# Paso 6: Abrir el proyecto en Android Studio
echo "6. Abriendo Android Studio (puede tardar unos segundos)..."
npx cap open android

echo "--- ¡PROCESO CASI FINALIZADO! ---"
echo "Una vez en Android Studio, espera a que termine la sincronización y luego presiona el botón 'Run' para instalar la app en tu celular."
