require('dotenv').config();
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const WebSocketService = require('./services/websocket');
const routes = require('./routes');

// Initialiser Express
const app = express();
const server = http.createServer(app);

// Initialiser WebSocket
if (process.env.ENABLE_WEBSOCKET !== 'false') {
    const wsService = new WebSocketService(server);
    global.io = wsService.io;
    console.log('✅ WebSocket activé');
}

// Importer et initialiser les services de queue
const { syncQueue } = require('./jobs/syncQueue');
const { creativeQueue } = require('./jobs/creativeQueue');

console.log('📊 Services de queue initialisés');

// Middleware de sécurité
app.use(helmet({
    contentSecurityPolicy: false // Désactiver pour le développement
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware de base
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging en développement
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Routes
app.use('/api/v1', routes);

// Route racine
app.get('/', (req, res) => {
    res.json({
        name: 'Meta Ads Generator API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            api: '/api/v1',
            health: '/health',
            docs: '/api/v1/ws/info'
        }
    });
});

// Health check
app.get('/health', async (req, res) => {
    try {
        const { pool } = require('./config/database');
        const { redisClient } = require('./config/redis');
        
        // Tester PostgreSQL
        let dbStatus = 'disconnected';
        try {
            await pool.query('SELECT 1');
            dbStatus = 'connected';
        } catch (e) {
            dbStatus = 'error';
        }
        
        // Tester Redis
        let redisStatus = 'disconnected';
        try {
            await redisClient.ping();
            redisStatus = 'connected';
        } catch (e) {
            redisStatus = 'error';
        }
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
            },
            services: {
                database: dbStatus,
                redis: redisStatus,
                websocket: global.io ? 'enabled' : 'disabled'
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err);
    
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Erreur serveur' : err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5001;

server.listen(PORT, async () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Meta Ads Generator Backend API                      ║
║                                                           ║
║   📡 API:        http://localhost:${PORT}/api/v1            ║
║   🔌 WebSocket:  ws://localhost:${PORT}                     ║
║   📊 Health:     http://localhost:${PORT}/health            ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
    
    // Initialiser les connexions
    try {
        const { pool } = require('./config/database');
        const { redisClient } = require('./config/redis');
        
        // Tester les connexions
        await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL connecté');
        
        if (redisClient.isOpen) {
            console.log('✅ Redis connecté');
        } else {
            console.warn('⚠️ Redis non connecté');
        }
        
        // Charger la queue
        const creativeQueue = require('./jobs/creativeQueue');
        console.log('✅ Job Queue initialisée');
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error.message);
    }
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
    // En production, on pourrait logger vers un service externe
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // En production, on devrait gracefully shutdown
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📴 SIGTERM reçu, arrêt gracieux...');
    
    server.close(async () => {
        console.log('✅ Serveur HTTP fermé');
        
        try {
            const { pool } = require('./config/database');
            const { redisClient } = require('./config/redis');
            const creativeQueue = require('./jobs/creativeQueue');
            
            await creativeQueue.close();
            await pool.end();
            await redisClient.quit();
            
            console.log('✅ Connexions fermées proprement');
            process.exit(0);
        } catch (error) {
            console.error('❌ Erreur fermeture:', error);
            process.exit(1);
        }
    });
});

module.exports = { app, server };
