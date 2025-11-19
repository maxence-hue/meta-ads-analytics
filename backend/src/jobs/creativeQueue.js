const Bull = require('bull');
const { query } = require('../config/database');
const { HTMLGenerator } = require('../services/htmlGenerator');
const AIImageGenerator = require('../services/aiImageGenerator');

// Créer la queue
const creativeQueue = new Bull('creative-generation', process.env.REDIS_URL || 'redis://localhost:6379', {
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 50
    }
});

// Configurer le nombre de jobs simultanés
const CONCURRENCY = parseInt(process.env.BULL_QUEUE_CONCURRENCY) || 5;

// Traiter les jobs de génération de créatives
creativeQueue.process('generate-creative', CONCURRENCY, async (job) => {
    const { brandId, templateId, data, userId } = job.data;
    
    try {
        console.log(`🚀 Job ${job.id}: Début génération creative`);
        
        // Notifier le démarrage via WebSocket
        if (global.io) {
            global.io.to(userId).emit('job:started', {
                jobId: job.id,
                type: 'generate-creative'
            });
        }
        
        // Étape 1: Récupérer la marque et le template
        job.progress(10);
        console.log(`📋 Job ${job.id}: Chargement brand et template`);
        
        const brandResult = await query('SELECT * FROM brands WHERE id = $1', [brandId]);
        const templateResult = await query('SELECT * FROM templates WHERE id = $1', [templateId]);
        
        if (brandResult.rows.length === 0) {
            throw new Error('Brand non trouvée');
        }
        if (templateResult.rows.length === 0) {
            throw new Error('Template non trouvé');
        }
        
        const brand = brandResult.rows[0];
        const template = templateResult.rows[0];
        
        // Étape 2: Générer les images IA si nécessaire
        job.progress(20);
        let images = data.images || {};
        
        if (data.generateImages) {
            console.log(`🎨 Job ${job.id}: Génération images IA`);
            const imageGenerator = new AIImageGenerator();
            
            const imageTypes = ['main', 'background', 'product'];
            for (const imageType of imageTypes) {
                if (data[`${imageType}Prompt`]) {
                    job.progress(20 + (imageTypes.indexOf(imageType) * 10));
                    
                    const result = await imageGenerator.generateImage(
                        data[`${imageType}Prompt`],
                        {
                            provider: data.aiProvider || 'dalle',
                            style: data.imageStyle || 'photorealistic',
                            dimensions: getImageDimensions(imageType, data.format)
                        }
                    );
                    
                    if (result.success && result.images.length > 0) {
                        images[imageType] = result.images[0].url;
                        
                        // Sauvegarder l'asset en base
                        await query(`
                            INSERT INTO assets (
                                brand_id, user_id, original_url, is_ai_generated, 
                                ai_prompt, ai_provider, file_type, category
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        `, [
                            brandId, userId, result.images[0].url, true,
                            data[`${imageType}Prompt`], data.aiProvider || 'dalle',
                            'image/jpeg', imageType
                        ]);
                    }
                }
            }
        }
        
        // Étape 3: Préparer les données de la creative
        job.progress(50);
        console.log(`📝 Job ${job.id}: Préparation données`);
        
        const creativeData = {
            ...data,
            images,
            brand,
            template
        };
        
        // Étape 4: Générer le HTML pour les 3 formats
        job.progress(60);
        console.log(`🏗️ Job ${job.id}: Génération HTML`);
        
        const htmlGenerator = new HTMLGenerator();
        const generated = await htmlGenerator.generateCreative(
            brand,
            template,
            creativeData
        );
        
        // Étape 5: Sauvegarder en base de données
        job.progress(80);
        console.log(`💾 Job ${job.id}: Sauvegarde en base`);
        
        const insertResult = await query(`
            INSERT INTO creatives (
                brand_id, template_id, user_id, 
                html_content, css_content, formats, 
                form_data, assets, validation_results, 
                validation_score, is_valid, preview_urls,
                generation_params, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
        `, [
            brandId,
            templateId,
            userId,
            generated.formats.landscape || '',
            '', // CSS séparé si nécessaire
            JSON.stringify(generated.formats),
            JSON.stringify(creativeData),
            JSON.stringify(images),
            JSON.stringify(generated.validation),
            calculateOverallScore(generated.validation),
            checkIfValid(generated.validation),
            JSON.stringify(generated.previews),
            JSON.stringify({
                aiProvider: data.aiProvider,
                imageStyle: data.imageStyle,
                generatedAt: new Date().toISOString()
            }),
            'completed'
        ]);
        
        const creativeId = insertResult.rows[0].id;
        
        // Mettre à jour le compteur d'usage du template
        await query(`
            UPDATE templates 
            SET usage_count = usage_count + 1 
            WHERE id = $1
        `, [templateId]);
        
        // Étape 6: Enregistrer le job en tant que complété
        job.progress(90);
        await query(`
            INSERT INTO jobs (id, user_id, type, status, progress, data, result)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
                status = $4,
                progress = $5,
                result = $7,
                completed_at = NOW()
        `, [
            job.id.toString(),
            userId,
            'generate-creative',
            'completed',
            100,
            JSON.stringify(job.data),
            JSON.stringify({ creativeId, previews: generated.previews })
        ]);
        
        // Étape 7: Notifier via WebSocket
        job.progress(100);
        console.log(`✅ Job ${job.id}: Terminé`);
        
        if (global.io) {
            global.io.to(userId).emit('creative:generated', {
                jobId: job.id,
                creativeId,
                previews: generated.previews,
                validation: generated.validation
            });
        }
        
        return {
            success: true,
            creativeId,
            formats: Object.keys(generated.formats),
            previews: generated.previews
        };
        
    } catch (error) {
        console.error(`❌ Job ${job.id} échoué:`, error);
        
        // Enregistrer l'erreur en base
        await query(`
            INSERT INTO jobs (id, user_id, type, status, error, data)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
                status = $4,
                error = $5,
                completed_at = NOW()
        `, [
            job.id.toString(),
            userId,
            'generate-creative',
            'failed',
            error.message,
            JSON.stringify(job.data)
        ]);
        
        // Notifier l'erreur via WebSocket
        if (global.io) {
            global.io.to(userId).emit('creative:failed', {
                jobId: job.id,
                error: error.message
            });
        }
        
        throw error;
    }
});

// Événements de la queue
creativeQueue.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} complété:`, result);
});

creativeQueue.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} échoué:`, err.message);
});

creativeQueue.on('progress', (job, progress) => {
    // Notifier la progression en temps réel
    if (global.io && job.data.userId) {
        global.io.to(job.data.userId).emit('job:progress', {
            jobId: job.id,
            progress,
            status: getProgressMessage(progress)
        });
    }
});

creativeQueue.on('stalled', (job) => {
    console.warn(`⚠️ Job ${job.id} bloqué`);
});

// Helper functions
function getImageDimensions(imageType, format = 'landscape') {
    const dimensions = {
        landscape: { main: { width: 1200, height: 628 }, background: { width: 1200, height: 628 }, product: { width: 600, height: 600 } },
        square: { main: { width: 1080, height: 1080 }, background: { width: 1080, height: 1080 }, product: { width: 800, height: 800 } },
        story: { main: { width: 1080, height: 1920 }, background: { width: 1080, height: 1920 }, product: { width: 800, height: 800 } }
    };
    
    return dimensions[format]?.[imageType] || { width: 1200, height: 628 };
}

function calculateOverallScore(validation) {
    const scores = Object.values(validation).map(v => v.score || 0);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100;
}

function checkIfValid(validation) {
    return Object.values(validation).every(v => v.valid !== false);
}

function getProgressMessage(progress) {
    if (progress < 20) return 'Chargement des données...';
    if (progress < 50) return 'Génération des images IA...';
    if (progress < 70) return 'Création du HTML...';
    if (progress < 90) return 'Validation et optimisation...';
    return 'Finalisation...';
}

// Nettoyage automatique des vieux jobs
setInterval(async () => {
    const completed = await creativeQueue.getCompleted();
    const failed = await creativeQueue.getFailed();
    
    const old = [...completed, ...failed].filter(job => {
        return Date.now() - job.finishedOn > 24 * 60 * 60 * 1000; // Plus de 24h
    });
    
    for (const job of old) {
        await job.remove();
    }
    
    console.log(`🧹 Nettoyage: ${old.length} jobs supprimés`);
}, 60 * 60 * 1000); // Toutes les heures

module.exports = creativeQueue;
