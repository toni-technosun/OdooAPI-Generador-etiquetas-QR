const express = require('express');
const cors = require('cors');
const duckdb = require('duckdb');
const path = require('path');

const app = express();
const port = 3001;

// Configuración de CORS y JSON parsing
app.use(cors({
    origin: '*', // Permitir todos los orígenes
    methods: ['GET', 'POST'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
    credentials: true // Permitir credenciales
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Ruta raíz que redirige a /studio
app.get('/', (req, res) => {
    res.redirect('/studio');
});

// Middleware para logging de solicitudes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`);
    next();
});

let db;
let connection;

// Inicialización de DuckDB
try {
    db = new duckdb.Database('database.db', { access_mode: 'READ_WRITE' }); // Aseguramos modo lectura/escritura
    connection = db.connect();
    console.log('DuckDB inicializado correctamente');
} catch (error) {
    console.error('Error al inicializar DuckDB:', error);
    process.exit(1);
}

// Inicializar tablas
function initializeTables() {
    try {
        // Verificar si las tablas existen
        connection.all(`
            SELECT name 
            FROM sqlite_master 
            WHERE type='table' AND name IN ('rma_records', 'logistics_records');
        `, (err, tables) => {
            if (err) {
                console.error('Error al verificar tablas existentes:', err);
                return;
            }

            console.log('Tablas existentes:', tables);

            // Crear las tablas solo si no existen
            const createTables = `
                CREATE SEQUENCE IF NOT EXISTS rma_id_seq;
                CREATE SEQUENCE IF NOT EXISTS logistics_id_seq;

                CREATE TABLE IF NOT EXISTS rma_records (
                    id INTEGER PRIMARY KEY DEFAULT(nextval('rma_id_seq')),
                    rma_number TEXT NOT NULL,
                    has_pallet BOOLEAN,
                    packaging_type TEXT,
                    packaging_condition TEXT,
                    bulk_count INTEGER,
                    images JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS logistics_records (
                    id INTEGER PRIMARY KEY DEFAULT(nextval('logistics_id_seq')),
                    sku TEXT NOT NULL,
                    serial_numbers TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            connection.exec(createTables, (err) => {
                if (err) {
                    console.error('Error al verificar/crear las tablas:', err);
                    return;
                }

                console.log('Tablas verificadas/creadas correctamente');

                // Verificar contenido de las tablas
                connection.all('SELECT COUNT(*) as count FROM rma_records', (err, result) => {
                    if (err) {
                        console.error('Error al verificar tabla rma_records:', err);
                    } else {
                        console.log('Registros en rma_records:', result[0].count);
                    }
                });

                connection.all('SELECT COUNT(*) as count FROM logistics_records', (err, result) => {
                    if (err) {
                        console.error('Error al verificar tabla logistics_records:', err);
                    } else {
                        console.log('Registros en logistics_records:', result[0].count);
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error al inicializar las tablas:', error);
    }
}

initializeTables();

// Rutas API
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.post('/api/rma', (req, res) => {
    try {
        const { rma, isPallet, packagingType, packagingCondition, bulkCount, images } = req.body;
        console.log('Datos completos recibidos en /api/rma:', JSON.stringify(req.body, null, 2));
        
        if (!rma) {
            console.error('Error: RMA number es requerido');
            return res.status(400).json({ error: 'RMA number es requerido' });
        }

        if (!images || !Array.isArray(images) || images.length === 0) {
            console.error('Error: Se requiere al menos una imagen');
            return res.status(400).json({ error: 'Se requiere al menos una imagen. Por favor, tome una foto del producto.' });
        }

        // Función auxiliar para formatear valores para SQL
        const sqlValue = (value) => {
            if (value === null || value === undefined) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (typeof value === 'boolean') return value ? 'true' : 'false';
            if (Array.isArray(value)) return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            return value;
        };

        const values = [
            sqlValue(rma),
            sqlValue(isPallet === 'pallet'),
            sqlValue(packagingType),
            sqlValue(packagingCondition),
            sqlValue(bulkCount ? parseInt(bulkCount) : null),
            sqlValue(images)
        ];

        const query = `
            INSERT INTO rma_records (
                rma_number, 
                has_pallet, 
                packaging_type, 
                packaging_condition, 
                bulk_count,
                images
            )
            VALUES (${values.join(', ')})
            RETURNING *
        `;

        console.log('Query de inserción a ejecutar:', query);
        
        connection.exec(query, (err, result) => {
            if (err) {
                console.error('Error al insertar registro RMA:', err);
                return res.status(500).json({ error: 'Error al guardar el registro', details: err.message });
            }

            console.log('Registro RMA insertado correctamente. Datos insertados:', result);
            res.json({ success: true, data: result });
        });
    } catch (error) {
        console.error('Error en el endpoint /api/rma:', error);
        res.status(500).json({ error: 'Error al guardar el registro', details: error.message });
    }
});

app.post('/api/logistics', (req, res) => {
    try {
        const { sku, serialNumbers } = req.body;
        console.log('Intentando guardar registro logístico:', { sku, serialNumbers });
        
        const query = `
            INSERT INTO logistics_records (sku, serial_numbers)
            VALUES (?, ?)
        `;

        const params = [
            sku || null,
            serialNumbers || null
        ];

        console.log('Parámetros de inserción:', params);
        
        connection.prepare(query).run(params, (err) => {
            if (err) {
                console.error('Error al insertar registro logístico:', err);
                return res.status(500).json({ error: 'Error al guardar el registro' });
            }
            console.log('Registro logístico guardado correctamente');
            res.json({ success: true });
        });
    } catch (error) {
        console.error('Error al agregar registro logístico:', error);
        res.status(500).json({ error: 'Error al guardar el registro' });
    }
});

app.get('/api/rma/recent', (req, res) => {
    try {
        console.log('Intentando obtener registros RMA...');
        const query = `
            SELECT * FROM rma_records
            ORDER BY created_at DESC
            LIMIT 10
        `;
        connection.prepare(query).all((err, rows) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.status(500).json({ error: 'Error al obtener registros' });
            }
            console.log('Registros RMA obtenidos:', rows);
            res.json(rows || []);
        });
    } catch (error) {
        console.error('Error al obtener registros RMA:', error);
        res.status(500).json({ error: 'Error al obtener registros' });
    }
});

app.get('/api/logistics/recent', (req, res) => {
    try {
        console.log('Intentando obtener registros logísticos...');
        const query = `
            SELECT * FROM logistics_records
            ORDER BY created_at DESC
            LIMIT 10
        `;
        connection.prepare(query).all((err, rows) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.status(500).json({ error: 'Error al obtener registros' });
            }
            console.log('Registros logísticos obtenidos:', rows);
            res.json(rows || []);
        });
    } catch (error) {
        console.error('Error al obtener registros logísticos:', error);
        res.status(500).json({ error: 'Error al obtener registros' });
    }
});

// Endpoint para DuckDB Studio
app.get('/studio', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'studio.html'));
});

app.post('/api/query', (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query es requerido' });
        }

        console.log('Ejecutando query:', query);

        connection.all(query, (err, result) => {
            if (err) {
                console.error('Error ejecutando query:', err);
                return res.status(500).json({ 
                    error: 'Error ejecutando query', 
                    details: err.message,
                    query: query 
                });
            }
            console.log('Query ejecutado correctamente');
            res.json({ data: result || [] });
        });
    } catch (error) {
        console.error('Error en el endpoint /api/query:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message,
            query: req.body.query 
        });
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    const interfaces = require('os').networkInterfaces();
    console.log('Servidor corriendo en:');
    console.log(`- Local: http://localhost:${port}`);
    
    // Mostrar todas las IPs disponibles
    Object.keys(interfaces).forEach((iface) => {
        interfaces[iface].forEach((details) => {
            if (details.family === 'IPv4' && !details.internal) {
                console.log(`- Red: http://${details.address}:${port}`);
            }
        });
    });
}); 