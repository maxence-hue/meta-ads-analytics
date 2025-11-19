const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { CreativeValidator } = require('./htmlGenerator');

class WebSocketService {
    constructor(server) {
        this.io = socketIO(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:8001",
                methods: ["GET", "POST"],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });
        
        this.setupHandlers();
        this.connectedUsers = new Map();
        
        console.log('✅ WebSocket service initialisé');
    }
    
    setupHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connecté: ${socket.id}`);
            
            // Authentification
            socket.on('authenticate', async (token) => {
                try {
                    if (!token) {
                        socket.emit('auth:error', { error: 'Token manquant' });
                        return;
                    }
                    
                    const user = await this.verifyToken(token);
                    socket.userId = user.id;
                    socket.userEmail = user.email;
                    
                    // Joindre la room personnelle de l'utilisateur
                    socket.join(user.id);
                    
                    // Sauvegarder dans la map
                    this.connectedUsers.set(socket.id, {
                        userId: user.id,
                        email: user.email,
                        connectedAt: new Date()
                    });
                    
                    socket.emit('authenticated', { 
                        userId: user.id,
                        email: user.email
                    });
                    
                    console.log(`✅ Utilisateur authentifié: ${user.email} (${user.id})`);
                } catch (error) {
                    console.error('Erreur auth WebSocket:', error);
                    socket.emit('auth:error', { error: 'Token invalide' });
                }
            });
            
            // Subscription aux updates d'un job
            socket.on('subscribe:job', (jobId) => {
                if (!socket.userId) {
                    socket.emit('error', { message: 'Non authentifié' });
                    return;
                }
                
                socket.join(`job:${jobId}`);
                console.log(`📡 ${socket.userEmail} subscribed to job:${jobId}`);
                
                socket.emit('subscribed', { 
                    type: 'job', 
                    id: jobId 
                });
            });
            
            // Unsubscribe d'un job
            socket.on('unsubscribe:job', (jobId) => {
                socket.leave(`job:${jobId}`);
                console.log(`📡 ${socket.userEmail} unsubscribed from job:${jobId}`);
            });
            
            // Subscription aux updates d'une creative
            socket.on('subscribe:creative', (creativeId) => {
                if (!socket.userId) {
                    socket.emit('error', { message: 'Non authentifié' });
                    return;
                }
                
                socket.join(`creative:${creativeId}`);
                console.log(`📡 ${socket.userEmail} subscribed to creative:${creativeId}`);
                
                socket.emit('subscribed', { 
                    type: 'creative', 
                    id: creativeId 
                });
            });
            
            // Unsubscribe d'une creative
            socket.on('unsubscribe:creative', (creativeId) => {
                socket.leave(`creative:${creativeId}`);
                console.log(`📡 ${socket.userEmail} unsubscribed from creative:${creativeId}`);
            });
            
            // Live preview updates (collaboration en temps réel)
            socket.on('preview:update', async (data) => {
                if (!socket.userId) {
                    socket.emit('error', { message: 'Non authentifié' });
                    return;
                }
                
                try {
                    const { creativeId, format, html } = data;
                    
                    if (!creativeId || !format || !html) {
                        socket.emit('error', { message: 'Données incomplètes' });
                        return;
                    }
                    
                    // Valider en temps réel
                    const validator = new CreativeValidator();
                    const validation = await validator.validate(html, format);
                    
                    // Broadcaster aux autres clients dans la même room
                    socket.to(`creative:${creativeId}`).emit('preview:updated', {
                        format,
                        html,
                        validation,
                        updatedBy: {
                            userId: socket.userId,
                            email: socket.userEmail
                        },
                        timestamp: new Date().toISOString()
                    });
                    
                    // Confirmer à l'émetteur
                    socket.emit('preview:update:confirmed', {
                        format,
                        validation
                    });
                    
                } catch (error) {
                    console.error('Erreur preview update:', error);
                    socket.emit('error', { message: error.message });
                }
            });
            
            // Ping/Pong pour garder la connexion alive
            socket.on('ping', () => {
                socket.emit('pong');
            });
            
            // Heartbeat
            socket.on('heartbeat', () => {
                socket.emit('heartbeat:ack', { timestamp: Date.now() });
            });
            
            // Demande de status des jobs actifs
            socket.on('jobs:status', async () => {
                if (!socket.userId) {
                    socket.emit('error', { message: 'Non authentifié' });
                    return;
                }
                
                try {
                    const { query } = require('../config/database');
                    const result = await query(`
                        SELECT id, type, status, progress, created_at
                        FROM jobs
                        WHERE user_id = $1 AND status IN ('pending', 'processing')
                        ORDER BY created_at DESC
                        LIMIT 10
                    `, [socket.userId]);
                    
                    socket.emit('jobs:status:response', {
                        jobs: result.rows
                    });
                } catch (error) {
                    console.error('Erreur jobs status:', error);
                    socket.emit('error', { message: error.message });
                }
            });
            
            // Déconnexion
            socket.on('disconnect', (reason) => {
                console.log(`🔌 Client déconnecté: ${socket.id} (${reason})`);
                
                if (socket.userId) {
                    this.connectedUsers.delete(socket.id);
                    
                    // Notifier les autres utilisateurs dans les rooms communes
                    this.io.emit('user:disconnected', {
                        userId: socket.userId,
                        email: socket.userEmail
                    });
                }
            });
            
            // Gestion des erreurs
            socket.on('error', (error) => {
                console.error('Erreur socket:', error);
            });
        });
        
        // Middleware pour logger les events
        this.io.use((socket, next) => {
            const originalEmit = socket.emit;
            socket.emit = function(...args) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`📤 WebSocket emit:`, args[0]);
                }
                return originalEmit.apply(socket, args);
            };
            next();
        });
    }
    
    async verifyToken(token) {
        try {
            // Vérifier le JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Optionnel: Vérifier que l'utilisateur existe en base
            const { query } = require('../config/database');
            const result = await query(
                'SELECT id, email, name FROM users WHERE id = $1 AND is_active = true',
                [decoded.userId || decoded.id]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Utilisateur non trouvé');
            }
            
            return result.rows[0];
        } catch (error) {
            throw new Error('Token invalide ou expiré');
        }
    }
    
    // Méthodes publiques pour envoyer des events
    
    notifyJobProgress(userId, jobId, progress, status) {
        this.io.to(userId).emit('job:progress', { 
            jobId, 
            progress, 
            status,
            timestamp: new Date().toISOString()
        });
        
        this.io.to(`job:${jobId}`).emit('job:progress', { 
            jobId, 
            progress, 
            status,
            timestamp: new Date().toISOString()
        });
    }
    
    notifyJobStarted(userId, jobId, type) {
        this.io.to(userId).emit('job:started', { 
            jobId, 
            type,
            timestamp: new Date().toISOString()
        });
    }
    
    notifyJobCompleted(userId, jobId, result) {
        this.io.to(userId).emit('job:completed', { 
            jobId, 
            result,
            timestamp: new Date().toISOString()
        });
        
        this.io.to(`job:${jobId}`).emit('job:completed', { 
            jobId, 
            result,
            timestamp: new Date().toISOString()
        });
    }
    
    notifyJobFailed(userId, jobId, error) {
        this.io.to(userId).emit('job:failed', { 
            jobId, 
            error,
            timestamp: new Date().toISOString()
        });
        
        this.io.to(`job:${jobId}`).emit('job:failed', { 
            jobId, 
            error,
            timestamp: new Date().toISOString()
        });
    }
    
    notifyCreativeGenerated(userId, creative) {
        this.io.to(userId).emit('creative:generated', { 
            ...creative,
            timestamp: new Date().toISOString()
        });
    }
    
    notifyCreativeUpdated(creativeId, updates) {
        this.io.to(`creative:${creativeId}`).emit('creative:updated', { 
            creativeId, 
            updates,
            timestamp: new Date().toISOString()
        });
    }
    
    notifyValidationComplete(creativeId, validation) {
        this.io.to(`creative:${creativeId}`).emit('validation:complete', { 
            creativeId, 
            validation,
            timestamp: new Date().toISOString()
        });
    }
    
    // Broadcaster un message à tous les clients connectés
    broadcast(event, data) {
        this.io.emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }
    
    // Obtenir les statistiques de connexion
    getStats() {
        return {
            connectedUsers: this.connectedUsers.size,
            rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
            users: Array.from(this.connectedUsers.values())
        };
    }
}

module.exports = WebSocketService;
