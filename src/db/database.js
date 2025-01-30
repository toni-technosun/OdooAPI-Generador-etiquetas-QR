// Obtener la URL base del servidor
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : `http://${window.location.hostname}:3001/api`;

export async function initializeDB() {
    try {
        // Primero intentamos el endpoint de salud
        const healthResponse = await fetch(`${API_URL}/health`);
        if (!healthResponse.ok) {
            throw new Error('El servidor no está respondiendo correctamente');
        }

        // Si el servidor está bien, intentamos obtener los registros
        const response = await fetch(`${API_URL}/rma/recent`);
        if (response.ok) {
            console.log('Conexión con el servidor establecida');
            return true;
        }

        throw new Error(`Error ${response.status}: ${response.statusText}`);
    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            console.error('No se pudo conectar al servidor. ¿Está el servidor ejecutándose?');
            throw new Error(`No se pudo conectar al servidor en ${API_URL}. Por favor, asegúrate de que el servidor backend está ejecutándose.`);
        }
        console.error('Error al inicializar la conexión:', error.message);
        throw error;
    }
}

export async function addRMARecord(rmaData) {
    try {
        console.log('Datos originales recibidos:', rmaData);
        
        // Asegurarse de que las imágenes estén en el formato correcto
        const formattedData = {
            ...rmaData,
            images: rmaData.images.map(img => ({
                url: img.url,
                type: img.type,
                name: img.name
            }))
        };

        console.log('Datos formateados a enviar:', formattedData);

        const response = await fetch(`${API_URL}/rma`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formattedData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error en la respuesta del servidor:', errorData);
            throw new Error(errorData.error || 'Error al guardar el registro');
        }

        const responseData = await response.json();
        console.log('Respuesta del servidor:', responseData);
        
        return true;
    } catch (error) {
        console.error('Error al agregar registro RMA:', error);
        return false;
    }
}

export async function addLogisticsRecord(logisticsData) {
    try {
        const response = await fetch(`${API_URL}/logistics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logisticsData)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar el registro');
        }
        
        return true;
    } catch (error) {
        console.error('Error al agregar registro logístico:', error);
        return false;
    }
}

export async function getRecentRMARecords(limit = 10) {
    try {
        const response = await fetch(`${API_URL}/rma/recent`);
        if (!response.ok) {
            throw new Error('Error al obtener registros');
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener registros RMA:', error);
        return [];
    }
}

export async function getRecentLogisticsRecords(limit = 10) {
    try {
        const response = await fetch(`${API_URL}/logistics/recent`);
        if (!response.ok) {
            throw new Error('Error al obtener registros');
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener registros logísticos:', error);
        return [];
    }
} 