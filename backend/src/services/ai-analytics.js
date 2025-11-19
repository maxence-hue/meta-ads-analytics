const { OpenAI } = require('openai');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const query = require('../config/database');
const redis = require('../config/redis');

class AIAnalyticsService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        this.googleVision = new GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
    }

    // Analyse complète des campagnes avec IA
    async analyzeCampaigns(userId, adAccountId, options = {}) {
        try {
            const cacheKey = `ai_analysis_${userId}_${adAccountId}_${JSON.stringify(options)}`;
            const cached = await redis.get(cacheKey);
            
            if (cached && !options.forceRefresh) {
                return JSON.parse(cached);
            }

            // Récupérer les données des campagnes
            const campaignsData = await this.getCampaignsData(userId, adAccountId);
            const insightsData = await this.getInsightsData(userId, adAccountId);
            const creativesData = await this.getCreativesData(userId, adAccountId);

            // Analyse avec GPT-4
            const gptAnalysis = await this.analyzeWithGPT4(campaignsData, insightsData, creativesData);
            
            // Analyse visuelle avec Google Vision
            const visionAnalysis = await this.analyzeCreativesWithVision(creativesData);
            
            // Recommandations IA
            const recommendations = await this.generateRecommendations(gptAnalysis, visionAnalysis, campaignsData);

            const analysis = {
                userId,
                adAccountId,
                timestamp: new Date().toISOString(),
                gptAnalysis,
                visionAnalysis,
                recommendations,
                summary: this.generateSummary(gptAnalysis, visionAnalysis, recommendations)
            };

            // Sauvegarder l'analyse
            await this.saveAnalysis(analysis);
            
            // Cache pendant 1 heure
            await redis.set(cacheKey, JSON.stringify(analysis), 3600);

            return analysis;
        } catch (error) {
            console.error('Erreur analyse IA campagnes:', error);
            throw error;
        }
    }

    // Analyse des performances avec GPT-4
    async analyzeWithGPT4(campaigns, insights, creatives) {
        try {
            const prompt = `
En tant qu'expert en marketing digital et analyse de campagnes Meta Ads, analyse les données suivantes :

DONNÉES DES CAMPAGNES :
${JSON.stringify(campaigns.slice(0, 5), null, 2)}

INSIGHTS DE PERFORMANCE :
${JSON.stringify(insights.slice(0, 10), null, 2)}

CRÉATIVES :
${JSON.stringify(creatives.slice(0, 3), null, 2)}

Génère une analyse détaillée en JSON avec ce format :
{
  "performanceOverview": {
    "globalScore": 85,
    "trend": "improving",
    "keyMetrics": {
      "avgCTR": 2.5,
      "avgCPC": 1.2,
      "avgROAS": 3.8,
      "conversionRate": 4.2
    }
  },
  "strengths": [
    "Fort taux de clics sur les campagnes vidéo",
    "Bon ROAS sur le segment mobile",
    "Créatives avec visages humains performent bien"
  ],
  "weaknesses": [
    "CPC élevé sur desktop",
    "Faible taux de conversion sur les nouvelles campagnes",
    "Budget mal distribué entre les campagnes"
  ],
  "opportunities": [
    "Augmenter le budget sur les campagnes performantes",
    "Tester de nouveaux formats créatifs",
    "Optimiser les ciblages démographiques"
  ],
  "campaignInsights": [
    {
      "campaignId": "123",
      "campaignName": "Collection Printemps",
      "performance": "excellent",
      "recommendations": ["Augmenter budget de 20%", "Dupliquer sur autres marchés"]
    }
  ],
  "budgetOptimization": {
    "totalRecommendedBudget": 15000,
    "reallocations": [
      {
        "fromCampaign": "Campagne A",
        "toCampaign": "Campagne B", 
        "amount": 2000,
        "reason": "Meilleur ROAS attendu"
      }
    ]
  }
}`;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.3,
                max_tokens: 2000
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
            console.error('Erreur analyse GPT-4:', error);
            return this.getFallbackAnalysis();
        }
    }

    // Analyse visuelle des créatives avec Google Vision
    async analyzeCreativesWithVision(creatives) {
        try {
            const visionResults = [];

            for (const creative of creatives.slice(0, 5)) {
                if (creative.thumbnail_url) {
                    const analysis = await this.analyzeImageWithVision(creative.thumbnail_url);
                    visionResults.push({
                        creativeId: creative.id,
                        creativeName: creative.name,
                        imageUrl: creative.thumbnail_url,
                        analysis
                    });
                }
            }

            // Analyse agrégée des tendances visuelles
            const trendsAnalysis = await this.analyzeVisualTrends(visionResults);

            return {
                individualAnalysis: visionResults,
                trends: trendsAnalysis,
                recommendations: this.generateVisualRecommendations(visionResults)
            };
        } catch (error) {
            console.error('Erreur analyse Vision:', error);
            return this.getFallbackVisionAnalysis();
        }
    }

    // Analyse d'une image avec Google Vision API
    async analyzeImageWithVision(imageUrl) {
        try {
            const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`;
            
            const requestBody = {
                requests: [{
                    image: { source: { imageUri: imageUrl } },
                    features: [
                        { type: 'LABEL_DETECTION', maxResults: 10 },
                        { type: 'WEB_DETECTION', maxResults: 5 },
                        { type: 'FACE_DETECTION', maxResults: 5 },
                        { type: 'TEXT_DETECTION', maxResults: 5 },
                        { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
                        { type: 'IMAGE_PROPERTIES', maxResults: 5 }
                    ]
                }]
            };

            const response = await axios.post(visionUrl, requestBody);
            const annotation = response.data.responses[0];

            return {
                labels: annotation.labelAnnotations?.map(label => ({
                    description: label.description,
                    score: label.score
                })) || [],
                webEntities: annotation.webDetection?.webEntities?.map(entity => ({
                    description: entity.description,
                    score: entity.score
                })) || [],
                faces: annotation.faceAnnotations?.length || 0,
                text: annotation.fullTextAnnotation?.text || '',
                objects: annotation.localizedObjectAnnotations?.map(obj => ({
                    name: obj.name,
                    score: obj.score
                })) || [],
                colors: annotation.imagePropertiesAnnotation?.dominantColors?.colors?.map(color => ({
                    color: color.color,
                    score: color.score,
                    pixelFraction: color.pixelFraction
                })) || [],
                visualScore: this.calculateVisualScore(annotation)
            };
        } catch (error) {
            console.error('Erreur analyse image Vision:', error);
            return { error: error.message };
        }
    }

    // Calculer un score visuel basé sur l'analyse Vision
    calculateVisualScore(annotation) {
        let score = 50; // Score de base

        // Bonus pour les visages détectés
        if (annotation.faceAnnotations && annotation.faceAnnotations.length > 0) {
            score += annotation.faceAnnotations.length * 10;
        }

        // Bonus pour les labels pertinents
        const relevantLabels = ['person', 'people', 'product', 'brand', 'fashion', 'lifestyle'];
        const relevantCount = annotation.labelAnnotations?.filter(label => 
            relevantLabels.some(rel => label.description.toLowerCase().includes(rel))
        ).length || 0;
        score += relevantCount * 5;

        // Bonus pour la présence de texte
        if (annotation.fullTextAnnotation?.text) {
            score += 10;
        }

        // Bonus pour les couleurs vives
        const brightColors = annotation.imagePropertiesAnnotation?.dominantColors?.colors?.filter(color => 
            color.score > 0.5 && color.pixelFraction > 0.1
        ).length || 0;
        score += brightColors * 3;

        return Math.min(100, Math.max(0, score));
    }

    // Générer des recommandations IA
    async generateRecommendations(gptAnalysis, visionAnalysis, campaignsData) {
        try {
            const prompt = `
Basé sur les analyses suivantes, génère des recommandations actionnables pour optimiser les campagnes Meta Ads :

ANALYSE GPT-4 :
${JSON.stringify(gptAnalysis, null, 2)}

ANALYSE VISUELLE :
${JSON.stringify(visionAnalysis, null, 2)}

DONNÉES CAMPAGNES :
${JSON.stringify(campaignsData.slice(0, 3), null, 2)}

Génère 10 recommandations priorisées en JSON avec ce format :
{
  "recommendations": [
    {
      "id": 1,
      "priority": "high",
      "category": "budget",
      "title": "Réallouer 30% du budget vers les campagnes vidéo",
      "description": "Les campagnes vidéo ont un ROAS 2.5x supérieur aux autres formats",
      "expectedImpact": "Augmentation du ROAS de 15-20%",
      "implementation": {
        "steps": ["Identifier les campagnes vidéo performantes", "Transférer le budget des campagnes moins performantes"],
        "timeToImplement": "1-2 jours",
        "resources": ["Accès Business Manager Meta"]
      },
      "metrics": ["ROAS", "CTR", "CPC"]
    }
  ]
}`;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.4,
                max_tokens: 1500
            });

            const result = JSON.parse(completion.choices[0].message.content);
            return result.recommendations || [];
        } catch (error) {
            console.error('Erreur génération recommandations:', error);
            return this.getFallbackRecommendations();
        }
    }

    // Analyse des tendances visuelles
    async analyzeVisualTrends(visionResults) {
        const trends = {
            dominantColors: [],
            commonElements: [],
            textUsage: 0,
            faceUsage: 0,
            visualPatterns: []
        };

        // Analyser les couleurs dominantes
        const allColors = visionResults.flatMap(result => 
            result.analysis.colors?.map(color => color.color) || []
        );

        // Compter les éléments communs
        const allLabels = visionResults.flatMap(result => 
            result.analysis.labels?.map(label => label.description) || []
        );

        // Calculer les tendances
        trends.commonElements = this.getMostCommon(allLabels, 5);
        trends.textUsage = visionResults.filter(result => result.analysis.text).length / visionResults.length * 100;
        trends.faceUsage = visionResults.filter(result => result.analysis.faces > 0).length / visionResults.length * 100;

        return trends;
    }

    // Obtenir les éléments les plus communs
    getMostCommon(array, count) {
        const frequency = {};
        array.forEach(item => {
            frequency[item] = (frequency[item] || 0) + 1;
        });
        
        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, count)
            .map(([item, freq]) => ({ item, frequency: freq }));
    }

    // Générer un résumé exécutif
    generateSummary(gptAnalysis, visionAnalysis, recommendations) {
        const highPriorityRecs = recommendations.filter(rec => rec.priority === 'high').length;
        const avgVisualScore = visionAnalysis.individualAnalysis.reduce((sum, item) => 
            sum + (item.analysis.visualScore || 0), 0) / visionAnalysis.individualAnalysis.length;

        return {
            overallHealth: gptAnalysis.performanceOverview.globalScore,
            keyInsights: [
                `${gptAnalysis.performanceOverview.keyMetrics.avgCTR}% CTR moyen`,
                `${gptAnalysis.performanceOverview.keyMetrics.avgROAS}x ROAS moyen`,
                `${highPriorityRecs} recommandations prioritaires`,
                `${Math.round(avgVisualScore)}/100 score visuel moyen`
            ],
            topRecommendations: recommendations.slice(0, 3).map(rec => rec.title),
            nextSteps: [
                'Implémenter les recommandations haute priorité',
                'Optimiser le budget selon les suggestions',
                'Créer de nouvelles créatives basées sur les tendances visuelles'
            ]
        };
    }

    // Sauvegarder l'analyse en base de données
    async saveAnalysis(analysis) {
        try {
            await query(`
                INSERT INTO ai_analytics (
                    user_id, ad_account_id, analysis_data, created_at, updated_at
                ) VALUES ($1, $2, $3, NOW(), NOW())
                ON CONFLICT (user_id, ad_account_id) 
                DO UPDATE SET 
                    analysis_data = EXCLUDED.analysis_data,
                    updated_at = NOW()
            `, [
                analysis.userId,
                analysis.adAccountId,
                JSON.stringify(analysis)
            ]);
        } catch (error) {
            console.error('Erreur sauvegarde analyse IA:', error);
        }
    }

    // Récupérer les données des campagnes
    async getCampaignsData(userId, adAccountId) {
        try {
            const result = await query(`
                SELECT * FROM meta_campaigns 
                WHERE user_id = $1 AND ad_account_id = $2
                ORDER BY created_at DESC
                LIMIT 10
            `, [userId, adAccountId]);
            
            return result.rows;
        } catch (error) {
            console.error('Erreur récupération campagnes:', error);
            return [];
        }
    }

    // Récupérer les insights
    async getInsightsData(userId, adAccountId) {
        try {
            const result = await query(`
                SELECT * FROM meta_insights 
                WHERE user_id = $1 AND ad_account_id = $2
                ORDER BY date_start DESC
                LIMIT 20
            `, [userId, adAccountId]);
            
            return result.rows;
        } catch (error) {
            console.error('Erreur récupération insights:', error);
            return [];
        }
    }

    // Récupérer les créatives
    async getCreativesData(userId, adAccountId) {
        try {
            const result = await query(`
                SELECT * FROM meta_creatives 
                WHERE user_id = $1 AND ad_account_id = $2
                ORDER BY created_at DESC
                LIMIT 10
            `, [userId, adAccountId]);
            
            return result.rows;
        } catch (error) {
            console.error('Erreur récupération créatives:', error);
            return [];
        }
    }

    // Analyses de secours si les IA ne sont pas disponibles
    getFallbackAnalysis() {
        return {
            performanceOverview: {
                globalScore: 70,
                trend: "stable",
                keyMetrics: {
                    avgCTR: 1.8,
                    avgCPC: 1.5,
                    avgROAS: 2.5,
                    conversionRate: 2.8
                }
            },
            strengths: ["Présence constante sur la plateforme"],
            weaknesses: ["Optimisation nécessaire"],
            opportunities: ["Potentiel d'amélioration"],
            campaignInsights: [],
            budgetOptimization: {
                totalRecommendedBudget: 10000,
                reallocations: []
            }
        };
    }

    getFallbackVisionAnalysis() {
        return {
            individualAnalysis: [],
            trends: {
                dominantColors: [],
                commonElements: [],
                textUsage: 50,
                faceUsage: 30,
                visualPatterns: []
            },
            recommendations: ["Tester différentes approches visuelles"]
        };
    }

    getFallbackRecommendations() {
        return [
            {
                id: 1,
                priority: "medium",
                category: "optimization",
                title: "Optimiser les ciblages",
                description: "Affiner les audiences pour améliorer la performance",
                expectedImpact: "Amélioration du CTR",
                implementation: {
                    steps: ["Analyser les audiences actuelles", "Tester nouvelles ciblages"],
                    timeToImplement: "3-5 jours",
                    resources: ["Business Manager"]
                },
                metrics: ["CTR", "Conversions"]
            }
        ];
    }

    generateVisualRecommendations(visionResults) {
        const recommendations = [];
        
        const avgVisualScore = visionResults.reduce((sum, result) => 
            sum + (result.analysis.visualScore || 0), 0) / visionResults.length;
        
        if (avgVisualScore < 60) {
            recommendations.push("Améliorer la qualité visuelle des créatives");
        }
        
        const faceUsage = visionResults.filter(result => result.analysis.faces > 0).length / visionResults.length * 100;
        if (faceUsage < 30) {
            recommendations.push("Tester des créatives avec des visages humains");
        }
        
        const textUsage = visionResults.filter(result => result.analysis.text).length / visionResults.length * 100;
        if (textUsage < 50) {
            recommendations.push("Ajouter du texte informatif dans les créatives");
        }
        
        return recommendations;
    }
}

module.exports = new AIAnalyticsService();
