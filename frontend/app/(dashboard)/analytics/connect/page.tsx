'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Facebook, CheckCircle, AlertCircle, ExternalLink, RefreshCw, 
    Settings, Database, TrendingUp, Shield, ArrowRight, Brain
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

interface ConnectionStatus {
    connected: boolean;
    connection?: {
        id: string;
        userInfo: {
            id: string;
            name: string;
            email: string;
            picture: string;
        };
        adAccounts: Array<{
            id: string;
            name: string;
            account_status: string;
            currency: string;
            timezone_name: string;
        }>;
        expiresAt: string;
        createdAt: string;
    };
    message?: string;
}

function AnalyticsConnectPageContent() {
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
    const [authURL, setAuthURL] = useState<string>('');
    const searchParams = useSearchParams();

    useEffect(() => {
        checkConnectionStatus();
        
        // Vérifier si on revient de l'authentification Meta
        const status = searchParams.get('status');
        const error = searchParams.get('error');
        
        if (status === 'success') {
            toast.success('Connexion Meta établie avec succès !');
            checkConnectionStatus();
        } else if (error) {
            toast.error(`Erreur de connexion: ${error}`);
        }
    }, [searchParams]);

    const checkConnectionStatus = async () => {
        try {
            const response = await apiClient.get('/meta/status');
            setConnectionStatus(response.data);
        } catch (error) {
            console.error('Erreur vérification statut:', error);
            setConnectionStatus({
                connected: false,
                message: 'Impossible de vérifier le statut de connexion'
            });
        } finally {
            setLoading(false);
        }
    };

    const initiateConnection = async () => {
        setConnecting(true);
        try {
            const response = await apiClient.get('/meta/connect');
            if (response.data.success) {
                setAuthURL(response.data.authURL);
                // Rediriger vers Meta pour l'authentification
                window.location.href = response.data.authURL;
            }
        } catch (error) {
            console.error('Erreur initiation connexion:', error);
            toast.error('Impossible d\'initier la connexion Meta');
        } finally {
            setConnecting(false);
        }
    };

    const disconnect = async () => {
        try {
            const response = await apiClient.post('/meta/disconnect');
            if (response.data.success) {
                toast.success('Connexion Meta révoquée');
                checkConnectionStatus();
            }
        } catch (error) {
            console.error('Erreur déconnexion:', error);
            toast.error('Impossible de révoquer la connexion');
        }
    };

    const refreshConnection = async () => {
        setLoading(true);
        await checkConnectionStatus();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getAccountStatusColor = (status: string) => {
        switch (status) {
            case '1': return 'bg-green-100 text-green-800';
            case '2': return 'bg-yellow-100 text-yellow-800';
            case '3': return 'bg-red-100 text-red-800';
            case '7': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getAccountStatusText = (status: string) => {
        switch (status) {
            case '1': return 'Actif';
            case '2': return 'En pause';
            case '3': return 'Désactivé';
            case '7': return 'En attente';
            default: return 'Inconnu';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Vérification de la connexion...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                    <Facebook className="h-8 w-8 text-blue-600" />
                    <h1 className="text-3xl font-bold">Connexion Meta Ads</h1>
                </div>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Connectez votre compte Meta Business pour accéder aux analytics complets de vos campagnes publicitaires 
                    et bénéficier de l'analyse IA powered by GPT-4.
                </p>
            </div>

            {/* Statut de connexion */}
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {connectionStatus?.connected ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                )}
                                Statut de la connexion
                            </CardTitle>
                            <CardDescription>
                                {connectionStatus?.connected 
                                    ? 'Votre compte Meta est connecté et synchronisé'
                                    : 'Aucune connexion Meta établie'
                                }
                            </CardDescription>
                        </div>
                        <Button variant="outline" onClick={refreshConnection}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Actualiser
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {connectionStatus?.connected ? (
                        <div className="space-y-6">
                            {/* Infos utilisateur */}
                            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                                <img 
                                    src={connectionStatus.connection?.userInfo.picture}
                                    alt={connectionStatus.connection?.userInfo.name}
                                    className="w-12 h-12 rounded-full"
                                />
                                <div className="flex-1">
                                    <h3 className="font-semibold">{connectionStatus.connection?.userInfo.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {connectionStatus.connection?.userInfo.email}
                                    </p>
                                </div>
                                <Badge className="bg-green-100 text-green-800">
                                    Connecté
                                </Badge>
                            </div>

                            {/* Détails de connexion */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Database className="h-4 w-4" />
                                        Comptes publicitaires
                                    </h4>
                                    <div className="space-y-2">
                                        {connectionStatus.connection?.adAccounts.map((account) => (
                                            <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <p className="font-medium">{account.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {account.currency} • {account.timezone_name}
                                                    </p>
                                                </div>
                                                <Badge className={getAccountStatusColor(account.account_status)}>
                                                    {getAccountStatusText(account.account_status)}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        Informations de connexion
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">ID de connexion:</span>
                                            <span className="font-mono">{connectionStatus.connection?.id.slice(0, 8)}...</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Connecté le:</span>
                                            <span>{formatDate(connectionStatus.connection?.createdAt || '')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Expire le:</span>
                                            <span>{formatDate(connectionStatus.connection?.expiresAt || '')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <Shield className="h-4 w-4" />
                                    Connexion sécurisée avec OAuth2
                                </div>
                                <Button variant="destructive" onClick={disconnect}>
                                    Révoquer la connexion
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 space-y-4">
                            <AlertCircle className="h-16 w-16 mx-auto text-yellow-500" />
                            <div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {connectionStatus?.message || 'Non connecté'}
                                </h3>
                                <p className="text-muted-foreground">
                                    Connectez votre compte Meta Business pour commencer à analyser vos campagnes
                                </p>
                            </div>
                            <Button 
                                onClick={initiateConnection}
                                disabled={connecting}
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Facebook className="h-4 w-4 mr-2" />
                                {connecting ? 'Redirection...' : 'Connecter Meta Ads'}
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Fonctionnalités disponibles */}
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-8">
                    Fonctionnalités disponibles avec la connexion Meta
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
                            <CardTitle>Analytics complets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• Métriques de performance en temps réel</li>
                                <li>• Analyse des campagnes et créatives</li>
                                <li>• Suivi des conversions et ROAS</li>
                                <li>• Export des données personnalisé</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Brain className="h-8 w-8 text-purple-600 mb-2" />
                            <CardTitle>Analyse IA GPT-4</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• Recommandations personnalisées</li>
                                <li>• Détection des tendances</li>
                                <li>• Optimisation automatique</li>
                                <li>• Insights actionnables</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Database className="h-8 w-8 text-green-600 mb-2" />
                            <CardTitle>Synchronisation automatique</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• Mise à jour en temps réel</li>
                                <li>• Historique complet</li>
                                <li>• TimescaleDB optimisé</li>
                                <li>• WebSocket notifications</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Guide de connexion */}
            {!connectionStatus?.connected && (
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>Guide de connexion</CardTitle>
                        <CardDescription>
                            Suivez ces étapes pour connecter votre compte Meta Business
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                    1
                                </div>
                                <div>
                                    <h4 className="font-semibold">Cliquez sur "Connecter Meta Ads"</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Vous serez redirigé vers la page d'authentification Facebook
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                    2
                                </div>
                                <div>
                                    <h4 className="font-semibold">Autorisez l'accès à votre compte</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Acceptez les permissions demandées pour accéder à vos données publicitaires
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                    3
                                </div>
                                <div>
                                    <h4 className="font-semibold">Retour sur le dashboard</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Vous serez automatiquement redirigé et pourrez commencer l'analyse
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function AnalyticsConnectPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Chargement...</p>
                </div>
            </div>
        }>
            <AnalyticsConnectPageContent />
        </Suspense>
    );
}
