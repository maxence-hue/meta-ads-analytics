'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
    TrendingUp, TrendingDown, DollarSign, Eye, MousePointer, Target,
    Brain, RefreshCw, Download, Calendar, Filter, AlertCircle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

interface Metrics {
    totalCampaigns: number;
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    avgCTR: number;
    avgCPC: number;
    avgCPM: number;
    totalConversions: number;
    avgCostPerConversion: number;
    avgROAS: number;
    totalReach: number;
    conversionRate: number;
    costPerThousandImpressions: number;
    clickThroughRate: number;
}

interface Campaign {
    id: string;
    name: string;
    status: string;
    objective: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    roas: number;
    performance: {
        efficiency: number;
        trend: string;
    };
}

interface TimeSeriesData {
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    roas: number;
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
    recommendations: Array<{
        id: number;
        priority: string;
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
    }>;
    summary: {
        overallHealth: number;
        keyInsights: string[];
        topRecommendations: string[];
        nextSteps: string[];
    };
}

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [dateRange, setDateRange] = useState('30d');
    const [adAccounts, setAdAccounts] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Charger les comptes publicitaires au montage
    useEffect(() => {
        loadAdAccounts();
    }, []);

    // Charger les données quand le compte ou la période changent
    useEffect(() => {
        if (selectedAccount) {
            loadDashboardData();
        }
    }, [selectedAccount, dateRange]);

    const loadAdAccounts = async () => {
        try {
            const response = await apiClient.get('/meta/accounts');
            if (response.data.success) {
                setAdAccounts(response.data.adAccounts);
                if (response.data.adAccounts.length > 0) {
                    setSelectedAccount(response.data.adAccounts[0].id);
                }
            }
        } catch (error) {
            console.error('Erreur chargement comptes:', error);
            toast.error('Impossible de charger les comptes publicitaires');
        }
    };

    const loadDashboardData = async () => {
        if (!selectedAccount) return;
        
        setLoading(true);
        try {
            const response = await apiClient.get('/analytics/dashboard', {
                params: { adAccountId: selectedAccount, dateRange }
            });
            
            if (response.data.success) {
                const dashboard = response.data.dashboard;
                setMetrics(dashboard.metrics);
                setCampaigns(dashboard.campaignPerformance);
                setTimeSeriesData(dashboard.timeSeriesData);
                setAiAnalysis(dashboard.aiAnalysis);
            }
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
            toast.error('Impossible de charger les données analytics');
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        setRefreshing(true);
        try {
            const response = await apiClient.get('/analytics/dashboard', {
                params: { adAccountId: selectedAccount, dateRange, refresh: true }
            });
            
            if (response.data.success) {
                const dashboard = response.data.dashboard;
                setMetrics(dashboard.metrics);
                setCampaigns(dashboard.campaignPerformance);
                setTimeSeriesData(dashboard.timeSeriesData);
                setAiAnalysis(dashboard.aiAnalysis);
                toast.success('Données actualisées avec succès');
            }
        } catch (error) {
            console.error('Erreur actualisation:', error);
            toast.error('Impossible d\'actualiser les données');
        } finally {
            setRefreshing(false);
        }
    };

    const runAIAnalysis = async () => {
        try {
            toast.loading('Lancement de l\'analyse IA...');
            const response = await apiClient.post('/analytics/analyze', {
                adAccountId: selectedAccount,
                options: { forceRefresh: true }
            });
            
            if (response.data.success) {
                setAiAnalysis(response.data.analysis);
                toast.success('Analyse IA complétée');
            }
        } catch (error) {
            console.error('Erreur analyse IA:', error);
            toast.error('Impossible de lancer l\'analyse IA');
        }
    };

    const exportData = async (format: 'json' | 'csv') => {
        try {
            const response = await apiClient.get('/analytics/export', {
                params: { adAccountId: selectedAccount, dateRange, format },
                responseType: format === 'csv' ? 'blob' : 'json'
            });
            
            if (format === 'csv') {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `meta-analytics-${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success('Export CSV téléchargé');
            } else {
                const blob = new Blob([JSON.stringify(response.data.data, null, 2)], {
                    type: 'application/json'
                });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `meta-analytics-${Date.now()}.json`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success('Export JSON téléchargé');
            }
        } catch (error) {
            console.error('Erreur export:', error);
            toast.error('Impossible d\'exporter les données');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('fr-FR').format(num);
    };

    const formatPercent = (num: number) => {
        return `${(num * 100).toFixed(2)}%`;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800';
            case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
            case 'INACTIVE': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Chargement des analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Analytics Meta Ads</h1>
                    <p className="text-muted-foreground">
                        Analyse complète des performances avec IA
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="Sélectionner un compte" />
                        </SelectTrigger>
                        <SelectContent>
                            {adAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                    {account.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">7 jours</SelectItem>
                            <SelectItem value="30d">30 jours</SelectItem>
                            <SelectItem value="90d">90 jours</SelectItem>
                            <SelectItem value="180d">180 jours</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Button 
                        variant="outline" 
                        onClick={refreshData}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                    
                    <Button onClick={runAIAnalysis}>
                        <Brain className="h-4 w-4 mr-2" />
                        Analyse IA
                    </Button>
                    
                    <Button variant="outline" onClick={() => exportData('json')}>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="ai-insights">Insights IA</TabsTrigger>
                    <TabsTrigger value="trends">Tendances</TabsTrigger>
                </TabsList>

                {/* Vue d'ensemble */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Métriques principales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Dépenses totales</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {metrics ? formatCurrency(metrics.totalSpend) : '€0'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Période sélectionnée
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {metrics ? formatNumber(metrics.totalImpressions) : '0'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {metrics ? formatNumber(metrics.totalReach) : '0'} portées uniques
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Clics</CardTitle>
                                <MousePointer className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {metrics ? formatNumber(metrics.totalClicks) : '0'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {metrics ? formatPercent(metrics.avgCTR) : '0%'} CTR moyen
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {metrics ? formatNumber(metrics.totalConversions) : '0'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {metrics ? formatCurrency(metrics.avgCostPerConversion) : '€0'} coût/conv.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Graphiques principaux */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Évolution des dépenses</CardTitle>
                                <CardDescription>Dépenses quotidiennes sur la période</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Area type="monotone" dataKey="spend" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Performance des campagnes</CardTitle>
                                <CardDescription>ROAS par campagne</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={campaigns.slice(0, 5)}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => `${Number(value).toFixed(2)}x`} />
                                        <Bar dataKey="roas" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Campagnes */}
                <TabsContent value="campaigns" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Liste des campagnes</CardTitle>
                            <CardDescription>Performance détaillée par campagne</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Campagne</th>
                                            <th className="text-left p-2">Statut</th>
                                            <th className="text-left p-2">Objectif</th>
                                            <th className="text-right p-2">Dépenses</th>
                                            <th className="text-right p-2">Impressions</th>
                                            <th className="text-right p-2">Clics</th>
                                            <th className="text-right p-2">CTR</th>
                                            <th className="text-right p-2">ROAS</th>
                                            <th className="text-right p-2">Efficacité</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {campaigns.map((campaign) => (
                                            <tr key={campaign.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2 font-medium">{campaign.name}</td>
                                                <td className="p-2">
                                                    <Badge className={getStatusColor(campaign.status)}>
                                                        {campaign.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-2">{campaign.objective}</td>
                                                <td className="p-2 text-right">{formatCurrency(campaign.spend)}</td>
                                                <td className="p-2 text-right">{formatNumber(campaign.impressions)}</td>
                                                <td className="p-2 text-right">{formatNumber(campaign.clicks)}</td>
                                                <td className="p-2 text-right">{formatPercent(campaign.ctr)}</td>
                                                <td className="p-2 text-right">{campaign.roas.toFixed(2)}x</td>
                                                <td className="p-2 text-right">{campaign.performance.efficiency.toFixed(0)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Performance */}
                <TabsContent value="performance" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Évolution du CTR</CardTitle>
                                <CardDescription>Taux de clics sur la période</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatPercent(Number(value))} />
                                        <Line type="monotone" dataKey="ctr" stroke="#8884d8" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Conversions quotidiennes</CardTitle>
                                <CardDescription>Nombre de conversions par jour</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="conversions" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Insights IA */}
                <TabsContent value="ai-insights" className="space-y-6">
                    {aiAnalysis ? (
                        <>
                            {/* Score global */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Brain className="h-5 w-5" />
                                        Analyse IA par GPT-4
                                    </CardTitle>
                                    <CardDescription>
                                        Dernière analyse: {new Date(aiAnalysis.summary?.overallHealth || 0).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-green-600">
                                                {aiAnalysis.performanceOverview?.globalScore || 0}/100
                                            </div>
                                            <p className="text-sm text-muted-foreground">Score global</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-blue-600">
                                                {aiAnalysis.performanceOverview?.keyMetrics?.avgROAS || 0}x
                                            </div>
                                            <p className="text-sm text-muted-foreground">ROAS moyen</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-purple-600">
                                                {formatPercent(aiAnalysis.performanceOverview?.keyMetrics?.avgCTR || 0)}
                                            </div>
                                            <p className="text-sm text-muted-foreground">CTR moyen</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Forces, faiblesses, opportunités */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-green-600 flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            Forces
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {aiAnalysis.strengths?.map((strength, index) => (
                                                <li key={index} className="flex items-start gap-2">
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
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {aiAnalysis.weaknesses?.map((weakness, index) => (
                                                <li key={index} className="flex items-start gap-2">
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
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {aiAnalysis.opportunities?.map((opportunity, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm">{opportunity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Recommandations */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recommandations IA</CardTitle>
                                    <CardDescription>
                                        Suggestions actionnables pour optimiser vos campagnes
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {aiAnalysis.recommendations?.map((rec) => (
                                            <div key={rec.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-semibold">{rec.title}</h4>
                                                    <Badge className={getPriorityColor(rec.priority)}>
                                                        {rec.priority}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {rec.description}
                                                </p>
                                                <p className="text-sm font-medium text-green-600 mb-2">
                                                    Impact attendu: {rec.expectedImpact}
                                                </p>
                                                <div className="text-xs text-muted-foreground">
                                                    <p><strong>Temps d'implémentation:</strong> {rec.implementation.timeToImplement}</p>
                                                    <p><strong>Métriques impactées:</strong> {rec.metrics.join(', ')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-8">
                                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">Aucune analyse IA disponible</h3>
                                <p className="text-muted-foreground mb-4">
                                    Lancez une analyse IA pour obtenir des insights personnalisés
                                </p>
                                <Button onClick={runAIAnalysis}>
                                    <Brain className="h-4 w-4 mr-2" />
                                    Lancer l'analyse IA
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Tendances */}
                <TabsContent value="trends" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Évolution du ROAS</CardTitle>
                                <CardDescription>Retour sur investissement publicitaire</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => `${Number(value).toFixed(2)}x`} />
                                        <Line type="monotone" dataKey="roas" stroke="#8884d8" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Distribution des dépenses</CardTitle>
                                <CardDescription>Dépenses par campagne</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={campaigns.slice(0, 5).map(c => ({
                                                name: c.name,
                                                value: c.spend
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {campaigns.slice(0, 5).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
