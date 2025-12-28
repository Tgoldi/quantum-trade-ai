import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Brain,
    TrendingUp,
    Shield,
    Heart,
    Target,
    Zap,
    RefreshCw,
    Clock,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';
import backendService from '@/api/backendService';

const AIAnalysisPanel = () => {
    const [symbol, setSymbol] = useState('AAPL');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const analyzeStock = async () => {
        if (!symbol.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const result = await backendService.getAIAnalysis(symbol.toUpperCase(), 100000);
            setAnalysis(result);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        analyzeStock();
    }, []);

    const getRecommendationColor = (recommendation) => {
        switch (recommendation) {
            case 'BUY': return 'bg-green-500';
            case 'SELL': return 'bg-red-500';
            case 'HOLD': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.7) return 'text-green-600';
        if (confidence >= 0.4) return 'text-yellow-600';
        return 'text-red-600';
    };

    const ModelAnalysisCard = ({ title, icon: Icon, analysis, color }) => (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className={`h-4 w-4 ${color}`} />
                    {title}
                </CardTitle>
                <CardDescription className="text-xs">
                    Confidence: <span className={getConfidenceColor(analysis.confidence)}>
                        {(analysis.confidence * 100).toFixed(0)}%
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2">
                    {title === 'Technical Analysis' && (
                        <Badge variant={analysis.trend === 'bullish' ? 'default' : analysis.trend === 'bearish' ? 'destructive' : 'secondary'}>
                            {analysis.trend?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                    )}
                    {title === 'Risk Assessment' && (
                        <Badge variant={analysis.risk_level === 'low' ? 'default' : analysis.risk_level === 'high' ? 'destructive' : 'secondary'}>
                            {analysis.risk_level?.toUpperCase() || 'UNKNOWN'} RISK
                        </Badge>
                    )}
                    {title === 'Market Sentiment' && (
                        <Badge variant={analysis.sentiment?.includes('bullish') ? 'default' : analysis.sentiment?.includes('bearish') ? 'destructive' : 'secondary'}>
                            {analysis.sentiment?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                    )}
                    {title === 'Trading Strategy' && (
                        <Badge variant={analysis.action === 'BUY' ? 'default' : analysis.action === 'SELL' ? 'destructive' : 'secondary'}>
                            {analysis.action || 'UNKNOWN'}
                        </Badge>
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {analysis.analysis || 'No analysis available'}
                    </p>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-500" />
                        Multi-LLM AI Trading Analysis
                    </CardTitle>
                    <CardDescription>
                        Advanced ensemble analysis using 4 specialized AI models
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter stock symbol (e.g., AAPL)"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            className="flex-1"
                            onKeyPress={(e) => e.key === 'Enter' && analyzeStock()}
                        />
                        <Button
                            onClick={analyzeStock}
                            disabled={loading}
                            className="min-w-[100px]"
                        >
                            {loading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                'Analyze'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {analysis && (
                <div className="space-y-6">
                    {/* Overall Recommendation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Ensemble Recommendation for {analysis.symbol}
                                </div>
                                {lastUpdated && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {lastUpdated.toLocaleTimeString()}
                                    </div>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-white font-bold ${getRecommendationColor(analysis.recommendation)}`}>
                                        {analysis.recommendation}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Final Decision</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{(analysis.confidence * 100).toFixed(0)}%</div>
                                    <p className="text-sm text-muted-foreground">Confidence</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">${analysis.price}</div>
                                    <p className="text-sm text-muted-foreground">Current Price</p>
                                </div>
                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${parseFloat(analysis.change_percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {parseFloat(analysis.change_percent) >= 0 ? '+' : ''}{analysis.change_percent}%
                                    </div>
                                    <p className="text-sm text-muted-foreground">Change</p>
                                </div>
                            </div>

                            {/* Ensemble Metrics */}
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span>Models Responded: {analysis.ensemble?.models_responded || 0}/{analysis.ensemble?.models_total || 4}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-blue-500" />
                                        <span>Response Time: {analysis.performance?.response_time_ms || 0}ms</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-purple-500" />
                                        <span>Agreement: {analysis.ensemble?.agreement_level || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Individual Model Analyses */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Individual Model Analyses</CardTitle>
                            <CardDescription>
                                Detailed analysis from each specialized AI model
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <ModelAnalysisCard
                                    title="Technical Analysis"
                                    icon={TrendingUp}
                                    analysis={analysis.analyses?.technical || {}}
                                    color="text-blue-500"
                                />
                                <ModelAnalysisCard
                                    title="Risk Assessment"
                                    icon={Shield}
                                    analysis={analysis.analyses?.risk || {}}
                                    color="text-red-500"
                                />
                                <ModelAnalysisCard
                                    title="Market Sentiment"
                                    icon={Heart}
                                    analysis={analysis.analyses?.sentiment || {}}
                                    color="text-pink-500"
                                />
                                <ModelAnalysisCard
                                    title="Trading Strategy"
                                    icon={Target}
                                    analysis={analysis.analyses?.strategy || {}}
                                    color="text-green-500"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Model Details */}
                    <Tabs defaultValue="technical" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="technical" className="text-xs">Technical</TabsTrigger>
                            <TabsTrigger value="risk" className="text-xs">Risk</TabsTrigger>
                            <TabsTrigger value="sentiment" className="text-xs">Sentiment</TabsTrigger>
                            <TabsTrigger value="strategy" className="text-xs">Strategy</TabsTrigger>
                        </TabsList>

                        <TabsContent value="technical" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-blue-500" />
                                        Technical Analysis (Llama3.1 8B)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Trend Direction:</span>
                                            <Badge variant={analysis.analyses?.technical?.trend === 'bullish' ? 'default' : analysis.analyses?.technical?.trend === 'bearish' ? 'destructive' : 'secondary'}>
                                                {analysis.analyses?.technical?.trend?.toUpperCase() || 'UNKNOWN'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Confidence:</span>
                                            <span className={getConfidenceColor(analysis.analyses?.technical?.confidence || 0)}>
                                                {((analysis.analyses?.technical?.confidence || 0) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Analysis:</span>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {analysis.analyses?.technical?.analysis || 'No detailed analysis available'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="risk" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-red-500" />
                                        Risk Assessment (Mistral 7B)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Risk Level:</span>
                                            <Badge variant={analysis.analyses?.risk?.risk_level === 'low' ? 'default' : analysis.analyses?.risk?.risk_level === 'high' ? 'destructive' : 'secondary'}>
                                                {analysis.analyses?.risk?.risk_level?.toUpperCase() || 'UNKNOWN'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Confidence:</span>
                                            <span className={getConfidenceColor(analysis.analyses?.risk?.confidence || 0)}>
                                                {((analysis.analyses?.risk?.confidence || 0) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Assessment:</span>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {analysis.analyses?.risk?.analysis || 'No detailed assessment available'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="sentiment" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-pink-500" />
                                        Market Sentiment (Phi3 Mini)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Sentiment:</span>
                                            <Badge variant={analysis.analyses?.sentiment?.sentiment?.includes('bullish') ? 'default' : analysis.analyses?.sentiment?.sentiment?.includes('bearish') ? 'destructive' : 'secondary'}>
                                                {analysis.analyses?.sentiment?.sentiment?.toUpperCase() || 'UNKNOWN'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Confidence:</span>
                                            <span className={getConfidenceColor(analysis.analyses?.sentiment?.confidence || 0)}>
                                                {((analysis.analyses?.sentiment?.confidence || 0) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Analysis:</span>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {analysis.analyses?.sentiment?.analysis || 'No sentiment analysis available'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="strategy" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-green-500" />
                                        Trading Strategy (CodeLlama 13B)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Action:</span>
                                            <Badge variant={analysis.analyses?.strategy?.action === 'BUY' ? 'default' : analysis.analyses?.strategy?.action === 'SELL' ? 'destructive' : 'secondary'}>
                                                {analysis.analyses?.strategy?.action || 'UNKNOWN'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Confidence:</span>
                                            <span className={getConfidenceColor(analysis.analyses?.strategy?.confidence || 0)}>
                                                {((analysis.analyses?.strategy?.confidence || 0) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Strategy:</span>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {analysis.analyses?.strategy?.analysis || 'No strategy details available'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
};

export default AIAnalysisPanel;
