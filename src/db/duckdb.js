import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';

let db = null;
let connection = null;

export async function initializeDB() {
    try {
        // Registrar el worker de DuckDB
        const DUCKDB_CONFIG = {
            locateFile: (filename) => {
                if (filename === 'duckdb-mvp.wasm') {
                    return duckdb_wasm;
                }
                return filename;
            },
        };

        const worker = new Worker(duckdb_worker);
        const logger = new duckdb.ConsoleLogger();
        db = new duckdb.AsyncDuckDB(DUCKDB_CONFIG, logger, worker);
        await db.instantiate();
        connection = await db.connect();

        // Crear tablas iniciales
        await connection.query(`
            CREATE TABLE IF NOT EXISTS rma_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rma_number TEXT NOT NULL,
                has_pallet BOOLEAN,
                packaging_type TEXT,
                packaging_condition TEXT,
                bulk_count INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS logistics_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sku TEXT NOT NULL,
                serial_numbers TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('DuckDB initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing DuckDB:', error);
        return false;
    }
}

export async function addRMARecord(rmaData) {
    try {
        const { rma, isPallet, packagingType, packagingCondition, bulkCount } = rmaData;
        await connection.query(`
            INSERT INTO rma_records (rma_number, has_pallet, packaging_type, packaging_condition, bulk_count)
            VALUES (?, ?, ?, ?, ?)
        `, [rma, isPallet === 'pallet', packagingType, packagingCondition, parseInt(bulkCount)]);
        return true;
    } catch (error) {
        console.error('Error adding RMA record:', error);
        return false;
    }
}

export async function addLogisticsRecord(logisticsData) {
    try {
        const { sku, serialNumbers } = logisticsData;
        await connection.query(`
            INSERT INTO logistics_records (sku, serial_numbers)
            VALUES (?, ?)
        `, [sku, serialNumbers]);
        return true;
    } catch (error) {
        console.error('Error adding logistics record:', error);
        return false;
    }
}

export async function getRecentRMARecords(limit = 10) {
    try {
        const result = await connection.query(`
            SELECT * FROM rma_records
            ORDER BY created_at DESC
            LIMIT ?
        `, [limit]);
        return result;
    } catch (error) {
        console.error('Error getting recent RMA records:', error);
        return [];
    }
}

export async function getRecentLogisticsRecords(limit = 10) {
    try {
        const result = await connection.query(`
            SELECT * FROM logistics_records
            ORDER BY created_at DESC
            LIMIT ?
        `, [limit]);
        return result;
    } catch (error) {
        console.error('Error getting recent logistics records:', error);
        return [];
    }
}

export async function searchRMARecords(searchTerm) {
    try {
        const result = await connection.query(`
            SELECT * FROM rma_records
            WHERE rma_number LIKE ?
            ORDER BY created_at DESC
        `, [`%${searchTerm}%`]);
        return result;
    } catch (error) {
        console.error('Error searching RMA records:', error);
        return [];
    }
}

export async function searchLogisticsRecords(searchTerm) {
    try {
        const result = await connection.query(`
            SELECT * FROM logistics_records
            WHERE sku LIKE ? OR serial_numbers LIKE ?
            ORDER BY created_at DESC
        `, [`%${searchTerm}%`, `%${searchTerm}%`]);
        return result;
    } catch (error) {
        console.error('Error searching logistics records:', error);
        return [];
    }
}

export async function closeDB() {
    try {
        if (connection) {
            await connection.close();
        }
        if (db) {
            await db.terminate();
        }
        return true;
    } catch (error) {
        console.error('Error closing DuckDB:', error);
        return false;
    }
} 