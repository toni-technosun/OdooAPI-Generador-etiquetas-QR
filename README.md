# Generador de Etiquetas Logísticas QR

Esta es una aplicación frontend para generar etiquetas logísticas con códigos QR.

## Primeros Pasos

### Desarrollo

Para ejecutar el servidor de desarrollo:

1.  **Instalar dependencias:**
    ```sh
    npm install
    ```

2.  **Iniciar el servidor de desarrollo:**
    ```sh
    npm run dev
    ```

    Esto iniciará el servidor de desarrollo de Vite. Abre tu navegador y navega a la URL proporcionada en la consola (normalmente `http://localhost:5173`).

### Ejecutando en un Servidor (para Producción o Acceso en Almacén)

Para ejecutar la aplicación en un servidor después de clonarla, sigue estos pasos:

1.  **Instalar dependencias:**
    Navega al directorio del proyecto en la terminal del servidor y ejecuta:
    ```sh
    npm install
    ```

2.  **Construir la aplicación:**
    Ejecuta el comando de construcción para generar archivos estáticos:
    ```sh
    npm run build
    ```
    Esto creará una carpeta `dist` que contiene los recursos estáticos.

3.  **Servir los archivos estáticos:**
    Puedes usar un servidor estático simple como `serve` para servir la aplicación. Si no tienes `serve` instalado globalmente, instálalo primero:
    ```sh
    npm install -g serve
    ```
    Luego, sirve la aplicación desde el directorio `dist`:
    ```sh
    serve dist
    ```
    `serve` mostrará una URL (ej., `http://localhost:5000` o `http://<your-server-ip>:5000`).

4.  **Acceder a la aplicación:**
    Abre un navegador web y ve a la URL proporcionada por el comando `serve`.

### Notas Importantes para el Despliegue en Servidor

*   **Puerto:** `serve` normalmente se ejecuta en el puerto 5000 por defecto. Puedes cambiar el puerto usando la opción `-p`, ej., `serve dist -p 8080`.
*   **Proceso en Segundo Plano:** Para un funcionamiento continuo, especialmente en un entorno de tipo producción, es posible que desees ejecutar `serve` como un proceso en segundo plano. Utiliza herramientas como `nohup` o `systemd` dependiendo de tu entorno de servidor.
*   **Servidores Web Alternativos:** Para configuraciones más robustas, considera usar servidores web como Nginx o Apache para servir los archivos estáticos en la carpeta `dist`. Estos ofrecen características más avanzadas para despliegues en producción.

## Características

*   Genera códigos QR para etiquetas logísticas.
*   Permite la entrada de SKU y números de serie.
*   Proporciona opciones para diferentes tamaños de etiqueta (110x50mm y 10x5mm).
*   Salida optimizada para impresión, mostrando solo el código QR y la etiqueta al imprimir.

## Tecnologías Utilizadas

*   React
*   Vite
*   qrcode.react (o qrcode)
*   CSS

---
