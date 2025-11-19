const redis = require('redis');
const { mockEnabled, mockCache, mockRedisClient } = require('./mock');

// Mode MOCK pour tests sans Redis
if (mockEnabled) {
    console.log('⚠️  MODE MOCK ACTIVÉ - Pas de vrai Redis');
    module.exports = { redisClient: mockRedisClient, cache: mockCache };
    return;
}

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                return new Error('❌ Redis: Trop de tentatives de reconnexion');
            }
            return retries * 100;
        }
    }
});

redisClient.on('connect', () => {
    console.log('✅ Redis connecté');
});

redisClient.on('error', (err) => {
    console.error('❌ Erreur Redis:', err);
});

redisClient.on('reconnecting', () => {
    console.log('🔄 Redis: Reconnexion...');
});

// Connecter au démarrage
(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('❌ Impossible de connecter à Redis:', error);
    }
})();

// Helper pour le cache
const cache = {
    async get(key) {
        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    },
    
    async set(key, value, expirationSeconds = 3600) {
        try {
            await redisClient.setEx(key, expirationSeconds, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    },
    
    async del(key) {
        try {
            await redisClient.del(key);
            return true;
        } catch (error) {
            console.error('Cache del error:', error);
            return false;
        }
    },
    
    async clear(pattern = '*') {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
            return true;
        } catch (error) {
            console.error('Cache clear error:', error);
            return false;
        }
    }
};

module.exports = {
    redisClient,
    cache
};
