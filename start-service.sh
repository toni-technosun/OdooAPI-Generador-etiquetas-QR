#!/bin/bash

# Directorio de la aplicación
APP_DIR="/opt/OdooAPI-Generador-etiquetas-QR"
PORT=5000

# Asegurarse de que estamos en el directorio correcto
cd $APP_DIR

# Instalar dependencias si no están instaladas
if [ ! -d "node_modules" ]; then
    npm install
fi

# Construir la aplicación si no existe la carpeta dist
if [ ! -d "dist" ]; then
    npm run build
fi

# Iniciar el servidor
npx serve dist -p $PORT 