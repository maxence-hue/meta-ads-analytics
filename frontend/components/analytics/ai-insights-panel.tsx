'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
    Brain, TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle,
    Lightbulb, Clock, TargetIcon, DollarSign, Eye, MousePointer
} from 'lucide-react';
import { toast } from 'sonner';

interface AIInsight {
    id: number;
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    expectedImpact: string;
    implementation: {
        steps: string[];
        timeToImplement: string;
        resources: string[];
    };
    metrics: string[];
}

interface AIAnalysis {
    performanceOverview: {
        globalScore: number;
        trend: string;
        keyMetrics: {
            avgCTR: number;
            avgCPC: number;
            avgROAS: number;
            conversionRate: number;
        };
    };
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    recommendations: AIInsight[];
    summary: {
        overallHealth: number;
        keyInsights: string[];
        topRecommendations: string[];
        nextSteps: string[];
    };
}

interface AIInsightsPanelProps {
    analysis: AIAnalysis | null;
    onRefreshAnalysis?: () => void;
    loading?: boolean;
}

export function AIInsightsPanel({ 
    analysis, 
    onRefreshAnalysis, 
    loading = false 
}: AIInsightsPanelProps) {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high': return <AlertCircle className="h-4 w-4" />;
            case 'medium': return <Target className="h-4 w-4" />;
            case 'low': return <CheckCircle className="h-4 w-4" />;
            default: return <Lightbulb className="h-4 w-4" />;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'budget': return <DollarSign className="h-4 w-4" />;
            case 'creative': return <Eye className="h-4 w-4" />;
            case 'targeting': return <TargetIcon className="h-4 w-4" />;
            case 'optimization': return <TrendingUp className="h-4 w-4" />;
            default: return <Lightbulb className="h-4 w-4" />;
        }
    };

    const formatPercent = (num: number) => {
        return `${(num * 100).toFixed(2)}%`;
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBackground = (score: number) => {
        if (score >= 80) return 'bg-green-50 border-green-200';
        if (score >= 60) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    if (!analysis) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucune analyse IA disponible</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Lancez une analyse IA pour obtenir des insights personnalisés sur vos campagnes Meta Ads
                    </p>
                    <Button onClick={onRefreshAnalysis} disabled={loading}>
                        <Brain className="h-4 w-4 mr-2" />
                        {loading ? 'Analyse en cours...' : 'Lancer l\'analyse IA'}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Score global */}
            <Card className={getScoreBackground(analysis.performanceOverview.globalScore)}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            Analyse IA par GPT-4
                        </CardTitle>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={onRefreshAnalysis}
                            disabled={loading}
                        >
                            <Brain className="h-4 w-4 mr-2" />
                            {loading ? '...' : 'Actualiser'}
                        </Button>
                    </div>
                    <CardDescription>
                        Analyse complète des performances avec intelligence artificielle
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className={`text-3xl font-bold ${getScoreColor(analysis.performanceOverview.globalScore)}`}>
                                {analysis.performanceOverview.globalScore}/100
                            </div>
                            <p className="text-sm text-muted-foreground">Score global</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {analysis.performanceOverview.keyMetrics.avgROAS}x
                            </div>
                            <p className="text-sm text-muted-foreground">ROAS moyen</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {formatPercent(analysis.performanceOverview.keyMetrics.avgCTR)}
                            </div>
                            <p className="text-sm text-muted-foreground">CTR moyen</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {formatPercent(analysis.performanceOverview.keyMetrics.conversionRate)}
                            </div>
                            <p className="text-sm text-muted-foreground">Taux de conversion</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Forces, Faiblesses, Opportunités */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-600 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Forces
                        </CardTitle>
                        <CardDescription>
                            Ce qui fonctionne bien dans vos campagnes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {analysis.strengths.map((strength, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" />
                            Faiblesses
                        </CardTitle>
                        <CardDescription>
                            Points à améliorer pour optimiser la performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {analysis.weaknesses.map((weakness, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{weakness}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-blue-600 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Opportunités
                        </CardTitle>
                        <CardDescription>
                            Pistes de croissance et d'optimisation
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {analysis.opportunities.map((opportunity, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{opportunity}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Insights clés */}
            {analysis.summary.keyInsights.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            Insights clés
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analysis.summary.keyInsights.map((insight, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                    <span className="text-sm">{insight}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recommandations détaillées */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Recommandations IA
                    </CardTitle>
                    <CardDescription>
                        Suggestions actionnables pour optimiser vos campagnes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {analysis.recommendations.map((recommendation) => (
                            <div 
                                key={recommendation.id} 
                                className={`border rounded-lg p-6 ${getPriorityColor(recommendation.priority)}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className={getPriorityColor(recommendation.priority)}>
                                            {getPriorityIcon(recommendation.priority)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold text-lg">{recommendation.title}</h4>
                                                <Badge className={getPriorityColor(recommendation.priority)}>
                                                    {recommendation.priority}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                {getCategoryIcon(recommendation.category)}
                                                <span>{recommendation.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm mb-4 leading-relaxed">
                                    {recommendation.description}
                                </p>

                                <div className="mb-4">
                                    <p className="text-sm font-medium text-green-600 mb-1">
                                        Impact attendu: {recommendation.expectedImpact}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Temps d'implémentation
                                        </h5>
                                        <p className="text-sm text-muted-foreground">
                                            {recommendation.implementation.timeToImplement}
                                        </p>
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <MousePointer className="h-4 w-4" />
                                            Métriques impactées
                                        </h5>
                                        <div className="flex flex-wrap gap-1">
                                            {recommendation.metrics.map((metric, index) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    {metric}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <div>
                                    <h5 className="text-sm font-medium mb-3">Étapes d'implémentation:</h5>
                                    <ol className="space-y-2">
                                        {recommendation.implementation.steps.map((step, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                                    {index + 1}
                                                </div>
                                                <span className="text-sm">{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                {recommendation.implementation.resources.length > 0 && (
                                    <div className="mt-4">
                                        <h5 className="text-sm font-medium mb-2">Ressources nécessaires:</h5>
                                        <div className="flex flex-wrap gap-1">
                                            {recommendation.implementation.resources.map((resource, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    {resource}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Prochaines étapes */}
            {analysis.summary.nextSteps.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Prochaines étapes recommandées
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analysis.summary.nextSteps.map((step, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                        {index + 1}
                                    </div>
                                    <span className="text-sm">{step}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
