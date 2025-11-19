const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validate');

// Routes principales pour le dashboard analytics
router.get('/dashboard', [
    query('adAccountId').notEmpty().withMessage('adAccountId requis'),
    query('dateRange').optional().isIn(['7d', '30d', '90d', '180d']).withMessage('Date range invalide'),
    query('refresh').optional().isBoolean().withMessage('Refresh doit être un booléen')
], validate, analyticsController.getDashboard);

// Lancer une analyse IA
router.post('/analyze', [
    body('adAccountId').notEmpty().withMessage('adAccountId requis'),
    body('options.forceRefresh').optional().isBoolean().withMessage('forceRefresh doit être un booléen')
], validate, analyticsController.runAIAnalysis);

// Obtenir les recommandations IA
router.get('/recommendations', [
    query('adAccountId').notEmpty().withMessage('adAccountId requis')
], validate, analyticsController.getRecommendations);

// Exporter les données analytics
router.get('/export', [
    query('adAccountId').notEmpty().withMessage('adAccountId requis'),
    query('format').optional().isIn(['json', 'csv']).withMessage('Format invalide'),
    query('dateRange').optional().isIn(['7d', '30d', '90d', '180d']).withMessage('Date range invalide')
], validate, analyticsController.exportAnalytics);

module.exports = router;
