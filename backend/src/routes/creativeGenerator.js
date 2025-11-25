const router = require('express').Router();
const creativeGeneratorController = require('../controllers/creativeGeneratorController');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Vérification du statut Gemini (pas d'auth requise pour monitoring)
router.get('/gemini-status', creativeGeneratorController.checkGeminiStatus.bind(creativeGeneratorController));

// Analyse de site web et génération d'idées
router.post('/analyze-site', creativeGeneratorController.analyzeSite.bind(creativeGeneratorController));

// Génération de variantes de texte
router.post('/generate-text-variants', creativeGeneratorController.generateTextVariants.bind(creativeGeneratorController));

// Génération d'images avec NanoBanana
router.post('/generate-background', creativeGeneratorController.generateBackgroundImage.bind(creativeGeneratorController));
router.post('/generate-image-variations', creativeGeneratorController.generateImageVariations.bind(creativeGeneratorController));

// Gestion des layouts
router.get('/layouts', creativeGeneratorController.getLayouts.bind(creativeGeneratorController));

// Génération de créatives
router.post('/generate-creative', creativeGeneratorController.generateCreative.bind(creativeGeneratorController));
router.post('/generate-multiple', creativeGeneratorController.generateMultipleCreatives.bind(creativeGeneratorController));

// Workflow complet
router.post('/generate-campaign', creativeGeneratorController.generateFullCampaign.bind(creativeGeneratorController));

// Statut des jobs asynchrones
router.get('/job/:jobId', creativeGeneratorController.getJobStatus.bind(creativeGeneratorController));

// Historique
router.get('/history', creativeGeneratorController.getCreativeHistory.bind(creativeGeneratorController));

// Upload de logo personnalisé
router.post('/upload-logo', 
    upload.single('logo'),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier uploadé' });
        }
        
        res.json({
            success: true,
            logoPath: `/uploads/${req.file.filename}`,
            filename: req.file.filename,
            size: req.file.size
        });
    }
);

// Upload d'image de fond personnalisée
router.post('/upload-background',
    upload.single('background'),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier uploadé' });
        }
        
        res.json({
            success: true,
            imagePath: `/uploads/${req.file.filename}`,
            filename: req.file.filename,
            size: req.file.size
        });
    }
);

module.exports = router;
