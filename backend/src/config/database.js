const { Pool } = require('pg');
const { mockEnabled, mockDatabase } = require('./mock');

// Mode MOCK pour tests sans DB
if (mockEnabled) {
    console.log('⚠️  MODE MOCK ACTIVÉ - Pas de vraie base de données');
    module.exports = mockDatabase;
    return;
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test de connexion
pool.on('connect', () => {
    console.log('✅ PostgreSQL connecté');
});

pool.on('error', (err) => {
    console.error('❌ Erreur PostgreSQL:', err);
});

// Helper pour les requêtes
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query exécutée', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('❌ Erreur query:', error);
        throw error;
    }
};

// Transaction helper
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Initialisation de la base de données avec TimescaleDB
const initializeDatabase = async () => {
    try {
        // Vérifier si TimescaleDB est installé
        const timescaleCheck = await query(`
            SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
        `);
        
        if (timescaleCheck.rows.length === 0) {
            console.warn('⚠️ TimescaleDB n\'est pas installé. Certaines fonctionnalités pourraient ne pas fonctionner.');
        }

        // Créer les tables si elles n'existent pas
        await createTables();
        
        console.log('✅ Base de données initialisée avec succès');
    } catch (error) {
        console.error('❌ Erreur initialisation base de données:', error);
        throw error;
    }
};

// Création des tables
const createTables = async () => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        const migrationPath = path.join(__dirname, '../../migrations/001_create_meta_tables.sql');
        
        if (fs.existsSync(migrationPath)) {
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
            await query(migrationSQL);
            console.log('📊 Tables Meta Analytics créées/mises à jour');
        } else {
            console.warn('⚠️ Fichier de migration non trouvé:', migrationPath);
        }
    } catch (error) {
        console.error('❌ Erreur création tables:', error);
        throw error;
    }
};

// Fonctions utilitaires pour les opérations courantes
const helpers = {
    // Insérer ou mettre à jour (UPSERT)
    upsert: async (table, data, conflictColumns) => {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
        
        const conflictTargets = Array.isArray(conflictColumns) ? conflictColumns.join(', ') : conflictColumns;
        const updates = columns
            .filter(col => !conflictColumns.includes(col))
            .map(col => `${col} = EXCLUDED.${col}`)
            .join(', ');
        
        const sql = `
            INSERT INTO ${table} (${columns.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT (${conflictTargets})
            DO UPDATE SET ${updates}
            RETURNING *
        `;
        
        return await query(sql, values);
    },

    // Pagination
    paginate: async (table, options = {}) => {
        const {
            where = '1=1',
            params = [],
            orderBy = 'created_at DESC',
            page = 1,
            limit = 20
        } = options;
        
        const offset = (page - 1) * limit;
        
        // Requête pour les données
        const dataQuery = `
            SELECT * FROM ${table}
            WHERE ${where}
            ORDER BY ${orderBy}
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        
        // Requête pour le comptage
        const countQuery = `
            SELECT COUNT(*) as total FROM ${table} WHERE ${where}
        `;
        
        const [dataResult, countResult] = await Promise.all([
            query(dataQuery, [...params, limit, offset]),
            query(countQuery, params)
        ]);
        
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);
        
        return {
            data: dataResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    },

    // Agrégations temporelles (pour TimescaleDB)
    timeSeries: async (table, timeColumn = 'date_start', options = {}) => {
        const {
            groupBy = 'day',
            aggregations = ['SUM(spend)', 'SUM(impressions)', 'SUM(clicks)'],
            where = '1=1',
            params = [],
            dateRange
        } = options;
        
        let timeGrouping;
        switch (groupBy) {
            case 'hour':
                timeGrouping = `date_trunc('hour', ${timeColumn})`;
                break;
            case 'day':
                timeGrouping = `date_trunc('day', ${timeColumn})`;
                break;
            case 'week':
                timeGrouping = `date_trunc('week', ${timeColumn})`;
                break;
            case 'month':
                timeGrouping = `date_trunc('month', ${timeColumn})`;
                break;
            default:
                timeGrouping = `date_trunc('day', ${timeColumn})`;
        }
        
        let whereClause = where;
        if (dateRange) {
            whereClause += ` AND ${timeColumn} >= $${params.length + 1} AND ${timeColumn} <= $${params.length + 2}`;
            params.push(dateRange.start, dateRange.end);
        }
        
        const sql = `
            SELECT 
                ${timeGrouping} as time_period,
                ${aggregations.join(', ')}
            FROM ${table}
            WHERE ${whereClause}
            GROUP BY time_period
            ORDER BY time_period ASC
        `;
        
        return await query(sql, params);
    }
};

// Test de connexion
const testConnection = async () => {
    try {
        const result = await query('SELECT NOW() as current_time, version() as version');
        console.log('✅ Connexion PostgreSQL réussie:', result.rows[0]);
        return true;
    } catch (error) {
        console.error('❌ Échec connexion PostgreSQL:', error);
        return false;
    }
};

// Nettoyage des ressources
const close = async () => {
    await pool.end();
    console.log('📊 Connexion PostgreSQL fermée');
};

module.exports = {
    pool,
    query,
    transaction,
    initializeDatabase,
    helpers,
    testConnection,
    close
};
