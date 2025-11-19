const express = require('express');
const router = express.Router();
const metaController = require('../controllers/metaController');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validate');

// Routes d'authentification Meta OAuth2
router.get('/connect', metaController.connect);
router.get('/callback', metaController.callback);
router.get('/status', metaController.getConnectionStatus);
router.post('/disconnect', metaController.disconnect);

// Routes des données Meta Ads
router.get('/accounts', metaController.getAdAccounts);
router.get('/campaigns', [
    query('adAccountId').notEmpty().withMessage('adAccountId requis'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100')
], validate, metaController.getCampaigns);

router.get('/insights', [
    query('adAccountId').notEmpty().withMessage('adAccountId requis'),
    query('level').optional().isIn(['campaign', 'adset', 'ad']).withMessage('Level invalide'),
    query('datePreset').optional().isIn(['today', 'yesterday', 'last_7d', 'last_30d', 'last_90d', 'this_month', 'last_month']).withMessage('Date preset invalide'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100')
], validate, metaController.getInsights);

router.post('/sync', [
    body('adAccountId').notEmpty().withMessage('adAccountId requis'),
    body('fullSync').optional().isBoolean().withMessage('fullSync doit être un booléen')
], validate, metaController.syncData);

module.exports = router;
