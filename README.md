# Generador de Etiquetas Logísticas QR

Esta es una aplicación frontend para generar etiquetas logísticas y RMA con códigos QR.

## Características

### Generales
* Interfaz con pestañas para diferentes tipos de etiquetas (Logística y RMA)
* Genera códigos QR para etiquetas logísticas y RMA
* Proporciona opciones para diferentes tamaños de etiqueta (110x50mm y 10x5mm)
* Salida optimizada para impresión, mostrando solo el código QR y la etiqueta al imprimir
* Interfaz optimizada para pantallas táctiles
* Validación de campos obligatorios
* Autofoco en campos principales para facilitar el uso con lectores de códigos de barras

### Etiquetas Logísticas
* Entrada de SKU con soporte para lector de códigos de barras
* Campo para múltiples números de serie
* Cambio automático al campo de números de serie después de escanear el SKU

### Etiquetas RMA
* Campo para número de RMA
* Selector de estado de pallet (Sí/No)
* Selector de tipo de embalaje (Original/No Original/Sin embalaje)
* Selector de estado del embalaje (Bueno/Regular/Malo)

## Primeros Pasos

### Desarrollo

Para ejecutar el servidor de desarrollo:

1. **Instalar dependencias:**
    ```bash
    npm install
    ```

2. **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

    El servidor se iniciará y mostrará las URLs disponibles, por ejemplo:
    ```
    ➜  Local:   http://localhost:5174/
    ➜  Network: http://192.168.10.71:5174/
    ```
    Usa la URL de "Network" para acceder desde otros dispositivos en la red.

3. **Iniciar el servidor backend:**
    ```bash
    cd server
    npm install
    npm run dev
    ```

    El servidor backend se iniciará y mostrará las URLs disponibles, por ejemplo:
    ```
    Servidor corriendo en:
    - Local: http://localhost:3001
    - Red: http://192.168.10.71:3001
    ```
    Los otros dispositivos en la red deben usar la URL de "Red".

### Instalación como Servicio en el Servidor

Para instalar la aplicación como un servicio en el servidor, sigue estos pasos:

1. **Clonar el repositorio en el servidor:**
```bash
sudo mkdir /opt/OdooAPI-Generador-etiquetas-QR
sudo chown node:node /opt/OdooAPI-Generador-etiquetas-QR
git clone https://github.com/toni-technosun/OdooAPI-Generador-etiquetas-QR.git /opt/OdooAPI-Generador-etiquetas-QR
```

2. **Copiar el archivo de servicio:**
```bash
sudo cp /opt/OdooAPI-Generador-etiquetas-QR/qr-generator.service /etc/systemd/system/
```

3. **Dar permisos al script de inicio:**
```bash
sudo chmod +x /opt/OdooAPI-Generador-etiquetas-QR/start-service.sh
```

4. **Recargar systemd y habilitar el servicio:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable qr-generator
sudo systemctl start qr-generator
```

5. **Verificar el estado del servicio:**
```bash
sudo systemctl status qr-generator
```

La aplicación estará disponible en la IP del servidor en el puerto 5000, por ejemplo: `http://192.168.10.71:5000`

### Comandos útiles para gestionar el servicio

- **Ver logs del servicio:**
```bash
sudo journalctl -u qr-generator -f
```

- **Reiniciar el servicio:**
```bash
sudo systemctl restart qr-generator
```

- **Detener el servicio:**
```bash
sudo systemctl stop qr-generator
```

## Uso con Lector de Códigos de Barras

La aplicación está optimizada para su uso con lectores de códigos de barras:

1. En la pestaña "Logística":
   - Al cargar la página, el cursor se posiciona automáticamente en el campo SKU
   - Después de escanear el SKU, el cursor salta automáticamente al campo de números de serie

2. En la pestaña "RMA":
   - Al cambiar a esta pestaña, el cursor se posiciona automáticamente en el campo RMA

## Tecnologías Utilizadas

* React
* Vite
* qrcode.react
* CSS

## Requisitos del Sistema

* Node.js 16 o superior
* npm 7 o superior
* Servidor Linux con systemd (para la instalación como servicio)
* Usuario y grupo 'node' en el sistema (crear si no existe)

---
