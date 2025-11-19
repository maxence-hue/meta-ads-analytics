import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useSocket } from './useSocket';
import { toast } from 'sonner';

export interface Metrics {
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

export interface Campaign {
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

export interface TimeSeriesData {
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    roas: number;
}

export interface AIAnalysis {
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

export interface DashboardData {
    userId: string;
    adAccountId: string;
    dateRange: string;
    lastUpdated: string;
    metrics: Metrics;
    campaignPerformance: Campaign[];
    timeSeriesData: TimeSeriesData[];
    aiAnalysis: AIAnalysis | null;
}

export interface AdAccount {
    id: string;
    name: string;
    account_status: string;
    currency: string;
    timezone_name: string;
}

export interface ConnectionStatus {
    connected: boolean;
    connection?: {
        id: string;
        userInfo: {
            id: string;
            name: string;
            email: string;
            picture: string;
        };
        adAccounts: AdAccount[];
        expiresAt: string;
        createdAt: string;
    };
    message?: string;
}

export function useAnalytics() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [dateRange, setDateRange] = useState<string>('30d');
    const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
    const [syncStatus, setSyncStatus] = useState<any>(null);

    const socket = useSocket();

    // Charger les comptes publicitaires
    const loadAdAccounts = useCallback(async () => {
        try {
            const response = await apiClient.get('/meta/accounts');
            if (response.data.success) {
                setAdAccounts(response.data.adAccounts);
                if (response.data.adAccounts.length > 0 && !selectedAccount) {
                    setSelectedAccount(response.data.adAccounts[0].id);
                }
            }
        } catch (error) {
            console.error('Erreur chargement comptes:', error);
            toast.error('Impossible de charger les comptes publicitaires');
        }
    }, [selectedAccount]);

    // Charger le statut de connexion
    const loadConnectionStatus = useCallback(async () => {
        try {
            const response = await apiClient.get('/meta/status');
            setConnectionStatus(response.data);
        } catch (error) {
            console.error('Erreur statut connexion:', error);
            setConnectionStatus({
                connected: false,
                message: 'Impossible de vérifier le connexion'
            });
        }
    }, []);

    // Charger les données du dashboard
    const loadDashboardData = useCallback(async (refresh = false) => {
        if (!selectedAccount) return;
        
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await apiClient.get('/analytics/dashboard', {
                params: { adAccountId: selectedAccount, dateRange, refresh }
            });
            
            if (response.data.success) {
                setDashboardData(response.data.dashboard);
                if (refresh) {
                    toast.success('Données actualisées avec succès');
                }
            }
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
            toast.error('Impossible de charger les données analytics');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedAccount, dateRange]);

    // Lancer une analyse IA
    const runAIAnalysis = useCallback(async () => {
        if (!selectedAccount) return;

        try {
            toast.loading('Lancement de l\'analyse IA...');
            const response = await apiClient.post('/analytics/analyze', {
                adAccountId: selectedAccount,
                options: { forceRefresh: true }
            });
            
            if (response.data.success) {
                setDashboardData(prev => prev ? {
                    ...prev,
                    aiAnalysis: response.data.analysis
                } : null);
                toast.success('Analyse IA complétée');
            }
        } catch (error) {
            console.error('Erreur analyse IA:', error);
            toast.error('Impossible de lancer l\'analyse IA');
        }
    }, [selectedAccount]);

    // Synchroniser les données
    const syncData = useCallback(async (fullSync = false) => {
        if (!selectedAccount) return;

        try {
            const response = await apiClient.post('/meta/sync', {
                adAccountId: selectedAccount,
                fullSync
            });
            
            if (response.data.success) {
                toast.success('Synchronisation lancée');
                setSyncStatus({ jobId: response.data.jobId, status: 'pending' });
            }
        } catch (error) {
            console.error('Erreur synchronisation:', error);
            toast.error('Impossible de lancer la synchronisation');
        }
    }, [selectedAccount]);

    // Exporter les données
    const exportData = useCallback(async (format: 'json' | 'csv' = 'json') => {
        if (!selectedAccount) return;

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
    }, [selectedAccount, dateRange]);

    // Initialiser la connexion Meta
    const initiateMetaConnection = useCallback(async () => {
        try {
            const response = await apiClient.get('/meta/connect');
            if (response.data.success) {
                window.location.href = response.data.authURL;
            }
        } catch (error) {
            console.error('Erreur connexion Meta:', error);
            toast.error('Impossible d\'initier la connexion Meta');
        }
    }, []);

    // Révoquer la connexion Meta
    const disconnectMeta = useCallback(async () => {
        try {
            const response = await apiClient.post('/meta/disconnect');
            if (response.data.success) {
                toast.success('Connexion Meta révoquée');
                loadConnectionStatus();
            }
        } catch (error) {
            console.error('Erreur déconnexion:', error);
            toast.error('Impossible de révoquer la connexion');
        }
    }, [loadConnectionStatus]);

    // WebSocket events
    useEffect(() => {
        if (!socket) return;

        // Écouter les événements de synchronisation
        const handleSyncEvent = (data: any) => {
            console.log('Sync event reçu:', data);
            
            if (data.type === 'sync_started') {
                setSyncStatus({ status: 'running', ...data.data });
                toast.info('Synchronisation en cours...');
            } else if (data.type === 'sync_completed') {
                setSyncStatus({ status: 'completed', ...data.data });
                toast.success('Synchronisation terminée');
                // Recharger les données
                loadDashboardData();
            } else if (data.type === 'sync_failed') {
                setSyncStatus({ status: 'failed', ...data.data });
                toast.error(`Synchronisation échouée: ${data.data.error}`);
            }
        };

        // Écouter les événements d'analyse IA
        const handleAnalysisEvent = (data: any) => {
            console.log('Analysis event reçu:', data);
            
            if (data.type === 'analysis_completed') {
                setDashboardData(prev => prev ? {
                    ...prev,
                    aiAnalysis: data.data.analysis
                } : null);
                toast.success('Nouvelle analyse IA disponible');
            }
        };

        // S'abonner aux événements
        const unsubscribeSync = socket.subscribe('sync:*', handleSyncEvent);
        const unsubscribeAnalysis = socket.subscribe('analysis:*', handleAnalysisEvent);

        // Nettoyage
        return () => {
            unsubscribeSync();
            unsubscribeAnalysis();
        };
    }, [socket, loadDashboardData]);

    // Charger les données initiales
    useEffect(() => {
        const initialize = async () => {
            await Promise.all([
                loadAdAccounts(),
                loadConnectionStatus()
            ]);
        };
        
        initialize();
    }, [loadAdAccounts, loadConnectionStatus]);

    // Charger les données du dashboard quand le compte ou la période changent
    useEffect(() => {
        if (selectedAccount) {
            loadDashboardData();
        }
    }, [selectedAccount, dateRange, loadDashboardData]);

    return {
        // État
        loading,
        refreshing,
        selectedAccount,
        dateRange,
        adAccounts,
        dashboardData,
        connectionStatus,
        syncStatus,
        
        // Actions
        setSelectedAccount,
        setDateRange,
        loadDashboardData,
        refreshData: () => loadDashboardData(true),
        runAIAnalysis,
        syncData,
        exportData,
        initiateMetaConnection,
        disconnectMeta,
        loadConnectionStatus,
        
        // Utilitaires
        formatCurrency: (amount: number) => {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
            }).format(amount);
        },
        formatNumber: (num: number) => {
            return new Intl.NumberFormat('fr-FR').format(num);
        },
        formatPercent: (num: number) => {
            return `${(num * 100).toFixed(2)}%`;
        }
    };
}
