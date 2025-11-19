// Mock configuration pour tests sans DB
const mockEnabled = process.env.MOCK_MODE === 'true';

const mockDatabase = {
    query: async (text, params) => {
        console.log('📝 MOCK Query:', text.substring(0, 100));
        
        // Simuler des réponses selon le type de requête
        if (text.includes('SELECT') && text.includes('brands')) {
            return {
                rows: [{
                    id: '00000000-0000-0000-0000-000000000001',
                    name: 'Demo Brand',
                    colors: { primary: '#667eea', secondary: '#764ba2' },
                    typography: { heading: 'Inter', body: 'Inter' },
                    created_at: new Date()
                }],
                rowCount: 1
            };
        }
        
        if (text.includes('SELECT') && text.includes('templates')) {
            return {
                rows: [{
                    id: '00000000-0000-0000-0000-000000000002',
                    name: 'Modern Template',
                    format: 'landscape',
                    category: 'modern',
                    html_template: '<div class="ad-content">{{headline}}</div>',
                    css_template: '.ad-content { padding: 20px; }'
                }],
                rowCount: 1
            };
        }
        
        if (text.includes('INSERT')) {
            return {
                rows: [{ id: '00000000-0000-0000-0000-' + Date.now().toString().slice(-12) }],
                rowCount: 1
            };
        }
        
        return { rows: [], rowCount: 0 };
    },
    transaction: async function(callback) {
        return callback({ query: this.query });
    },
    pool: {
        query: async function(...args) {
            return mockDatabase.query(...args);
        },
        on: () => {},
        end: async () => {}
    }
};

const mockCache = {
    get: async (key) => {
        console.log('📦 MOCK Cache GET:', key);
        return null;
    },
    set: async (key, value, ttl) => {
        console.log('📦 MOCK Cache SET:', key);
        return true;
    },
    del: async (key) => {
        console.log('📦 MOCK Cache DEL:', key);
        return true;
    },
    clear: async () => {
        console.log('📦 MOCK Cache CLEAR');
        return true;
    }
};

const mockRedisClient = {
    isOpen: true,
    connect: async () => {},
    ping: async () => 'PONG',
    quit: async () => {},
    on: () => {}
};

module.exports = {
    mockEnabled,
    mockDatabase,
    mockCache,
    mockRedisClient
};
