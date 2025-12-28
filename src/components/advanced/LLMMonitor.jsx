import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Brain,
    Activity,
    Clock,
    TrendingUp,
    AlertTriangle,
    XCircle,
    RefreshCw,
    DollarSign,
    Server,
    Globe
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import backendService from '../../api/backendService';

const LLMMonitor = () => {
    const [llmData, setLlmData] = useState([]);
    const [performanceMetrics, setPerformanceMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState(null);
    const [realTimeData, setRealTimeData] = useState([]);
    const [liveMetrics, setLiveMetrics] = useState({});
    const [systemHealth, setSystemHealth] = useState({});
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [testSymbol, setTestSymbol] = useState('AAPL');
    const [testResults, setTestResults] = useState(null);
    const [testLoading, setTestLoading] = useState(false);

    useEffect(() => {
        const initializeData = async () => {
            await loadLLMData();
            await loadPerformanceMetrics();
        };

        initializeData();

        // Real-time updates every 5 seconds
        const interval = setInterval(() => {
            updateRealTimeMetrics();
            fetchLiveSystemHealth();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Load real LLM data from server
    const loadLLMData = async () => {
        try {
            console.log('📡 Fetching real LLM data from server...');
            const data = await backendService.makeRequest('/llm/models');
            const models = data.models || []; // Extract models array from response
            setLlmData(models);
            if (models.length > 0 && !selectedModel) {
                setSelectedModel(models[0]);
            }
            console.log('✅ Loaded LLM data from server:', models.length, 'models');
        } catch (error) {
            console.error("Error loading LLM data:", error);
            setLlmData([]);
        }
        setLoading(false);
    };

    // Load real performance metrics from server
    const loadPerformanceMetrics = async () => {
        try {
            const metricsData = await backendService.makeRequest('/llm/metrics');
            setPerformanceMetrics(metricsData.metrics?.models || []);
            console.log('✅ Loaded performance metrics from server');
        } catch (error) {
            console.error('Error fetching performance metrics:', error);
            setPerformanceMetrics([]);
        }
    };

    // Fetch real-time system health
    const fetchLiveSystemHealth = async () => {
        try {
            const healthData = await backendService.makeRequest('/llm/health');
            setSystemHealth(healthData);
            console.log('✅ Updated system health from server');
        } catch (error) {
            console.error('Error fetching system health:', error);
            setSystemHealth({});
        }
    };

    // Update real-time metrics from server only
    const updateRealTimeMetrics = async () => {
        try {
            const data = await backendService.makeRequest('/llm/metrics');
            const metricsData = data.metrics || {};
            
            setRealTimeData(metricsData.models || []);

            // Update live metrics summary from real metrics data
            setLiveMetrics({
                totalRequests: metricsData.totalRequests || 0,
                activeConnections: llmData.length || 0, // Number of active models
                avgResponseTime: (metricsData.avgLatency || 0).toFixed(2),
                errorRate: ((1 - (metricsData.successRate || 1)) * 100).toFixed(2),
                tokensProcessed: metricsData.totalRequests * 50 || 0, // Estimate
                costToday: metricsData.avgCost || 0
            });

            setLastUpdate(new Date());
            console.log('✅ Updated real-time metrics from server');
        } catch (error) {
            console.error('Error fetching real-time metrics:', error);
        }
    };

    // Test investment decision
    const testInvestmentDecision = async () => {
        if (!testSymbol) return;

        setTestLoading(true);
        try {
            console.log(`🧪 Testing investment decision for ${testSymbol}...`);

            const result = await backendService.makeRequest('/ai/analyze', {
                method: 'POST',
                body: JSON.stringify({ symbol: testSymbol })
            });
            
            console.log(`✅ Investment analysis complete for ${testSymbol}:`, result);

            setTestResults({
                symbol: testSymbol,
                timestamp: new Date().toISOString(),
                ...result
            });
        } catch (error) {
            console.error('Error testing investment decision:', error);
            setTestResults({
                symbol: testSymbol,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
        setTestLoading(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'maintenance': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'offline': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getHealthColor = (value, type = 'usage') => {
        const numValue = parseFloat(value);
        if (type === 'usage') {
            return numValue > 80 ? 'text-red-400' : numValue > 60 ? 'text-yellow-400' : 'text-green-400';
        }
        return 'text-blue-400';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                    <span className="text-slate-300">Loading LLM Monitor...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-slate-950 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Brain className="w-8 h-8 text-blue-400" />
                        LLM Monitor
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Live
                        </Badge>
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Last update: {lastUpdate.toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={systemHealth.overallStatus === 'healthy' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}>
                        System Status: {systemHealth.overallStatus || 'Unknown'}
                    </Badge>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Active Models</p>
                                <p className="text-2xl font-bold text-white">{systemHealth.activeModels || 0}</p>
                            </div>
                            <Server className="w-8 h-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Live Requests</p>
                                <p className="text-2xl font-bold text-white">{liveMetrics.totalRequests || 0}</p>
                            </div>
                            <Activity className="w-8 h-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Avg Response</p>
                                <p className="text-2xl font-bold text-white">{liveMetrics.avgResponseTime || '0.00'}s</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Active Connections</p>
                                <p className="text-2xl font-bold text-white">{liveMetrics.activeConnections || 0}</p>
                            </div>
                            <Globe className="w-8 h-8 text-purple-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Error Rate</p>
                                <p className="text-2xl font-bold text-white">{liveMetrics.errorRate || '0.00'}%</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Cost Today</p>
                                <p className="text-2xl font-bold text-white">${liveMetrics.costToday || '0.00'}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Model List */}
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Brain className="w-5 h-5" />
                            Available Models ({llmData.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {llmData.length === 0 ? (
                            <div className="text-center py-8">
                                <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                                <p className="text-slate-400">No LLM models available</p>
                                <p className="text-slate-500 text-sm">Check your Ollama server connection</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {llmData.map((model, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedModel?.name === model.name
                                                ? 'bg-blue-500/20 border-blue-500/50'
                                                : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                                            }`}
                                        onClick={() => setSelectedModel(model)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-white">{model.name}</h3>
                                            <Badge className={getStatusColor(model.status)}>
                                                {model.status || 'unknown'}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-slate-400 space-y-1">
                                            <div>Provider: {model.provider || 'Unknown'}</div>
                                            <div>Version: {model.version || 'Unknown'}</div>
                                            <div>Success Rate: {model.performance?.success_rate || '0'}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Model Details */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedModel ? (
                        <Tabs defaultValue="parameters" className="w-full">
                            <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
                                <TabsTrigger value="parameters">Parameters</TabsTrigger>
                                <TabsTrigger value="performance">Performance</TabsTrigger>
                                <TabsTrigger value="usage">Usage</TabsTrigger>
                                <TabsTrigger value="health">Health</TabsTrigger>
                                <TabsTrigger value="investment">Investment Test</TabsTrigger>
                            </TabsList>

                            <TabsContent value="parameters">
                                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                                    <CardHeader>
                                        <CardTitle className="text-white">{selectedModel.name} - Parameters</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedModel.parameters ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                {Object.entries(selectedModel.parameters).map(([key, value]) => (
                                                    <div key={key} className="p-3 bg-slate-800/30 rounded-lg">
                                                        <div className="text-slate-400 text-sm capitalize">
                                                            {key.replace(/_/g, ' ')}
                                                        </div>
                                                        <div className="text-white font-semibold">
                                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-slate-400">No parameters available</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="performance">
                                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                                    <CardHeader>
                                        <CardTitle className="text-white">{selectedModel.name} - Performance</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedModel.performance ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    {Object.entries(selectedModel.performance).map(([key, value]) => (
                                                        <div key={key} className="p-3 bg-slate-800/30 rounded-lg">
                                                            <div className="text-slate-400 text-sm capitalize">
                                                                {key.replace(/_/g, ' ')}
                                                            </div>
                                                            <div className="text-white font-semibold">
                                                                {key.includes('rate') ? `${value}%` :
                                                                    key.includes('time') ? `${value}s` :
                                                                        value}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {performanceMetrics.length > 0 && (
                                                    <div className="h-64">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={performanceMetrics}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                                <XAxis dataKey="time" stroke="#64748b" />
                                                                <YAxis stroke="#64748b" />
                                                                <Tooltip
                                                                    contentStyle={{
                                                                        backgroundColor: '#1e293b',
                                                                        border: '1px solid #334155',
                                                                        borderRadius: '8px'
                                                                    }}
                                                                />
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="response_time"
                                                                    stroke="#3b82f6"
                                                                    strokeWidth={2}
                                                                    name="Response Time (s)"
                                                                />
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="success_rate"
                                                                    stroke="#10b981"
                                                                    strokeWidth={2}
                                                                    name="Success Rate (%)"
                                                                />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-slate-400">No performance data available</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="usage">
                                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                                    <CardHeader>
                                        <CardTitle className="text-white">{selectedModel.name} - Usage Statistics</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedModel.usage_stats ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                {Object.entries(selectedModel.usage_stats).map(([key, value]) => (
                                                    <div key={key} className="p-3 bg-slate-800/30 rounded-lg">
                                                        <div className="text-slate-400 text-sm capitalize">
                                                            {key.replace(/_/g, ' ')}
                                                        </div>
                                                        <div className="text-white font-semibold">
                                                            {key.includes('cost') ? `$${parseFloat(value || 0).toFixed(2)}` : (value || 0).toLocaleString()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-slate-400">No usage statistics available</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="health">
                                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                                    <CardHeader>
                                        <CardTitle className="text-white">{selectedModel.name} - Health Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedModel.health ? (
                                            <div className="space-y-4">
                                                {Object.entries(selectedModel.health).map(([key, value]) => (
                                                    <div key={key} className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                                                            <span className={getHealthColor(value, key.includes('usage') ? 'usage' : 'other')}>
                                                                {key.includes('usage') ? `${value}%` : value}
                                                            </span>
                                                        </div>
                                                        {key.includes('usage') && (
                                                            <Progress
                                                                value={parseFloat(value)}
                                                                className="h-2"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-slate-400">No health data available</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="investment">
                                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5" />
                                            Investment Decision Testing
                                        </CardTitle>
                                        <p className="text-slate-400 text-sm">
                                            Test your AI models&apos; investment decisions on real stocks
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Test Input */}
                                        <div className="flex gap-4 items-end">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    Stock Symbol
                                                </label>
                                                <input
                                                    type="text"
                                                    value={testSymbol}
                                                    onChange={(e) => setTestSymbol(e.target.value.toUpperCase())}
                                                    placeholder="Enter symbol (e.g., AAPL, TSLA)"
                                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <Button
                                                onClick={testInvestmentDecision}
                                                disabled={testLoading || !testSymbol}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                                            >
                                                {testLoading ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    'Test Decision'
                                                )}
                                            </Button>
                                        </div>

                                        {/* Test Results */}
                                        {testResults && (
                                            <div className="space-y-4">
                                                {testResults.error ? (
                                                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                                                        <div className="flex items-center gap-2 text-red-400 mb-2">
                                                            <XCircle className="w-4 h-4" />
                                                            Error Testing {testResults.symbol}
                                                        </div>
                                                        <p className="text-red-300 text-sm">{testResults.error}</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {/* Overall Decision */}
                                                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h3 className="text-lg font-semibold text-white">
                                                                    {testResults.symbol} Analysis
                                                                </h3>
                                                                <Badge className={
                                                                    testResults.recommendation === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                                        testResults.recommendation === 'SELL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                                            'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                                                }>
                                                                    {testResults.recommendation || 'HOLD'}
                                                                </Badge>
                                                            </div>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                <div>
                                                                    <div className="text-slate-400">Current Price</div>
                                                                    <div className="text-white font-semibold">${testResults.price}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-slate-400">Change</div>
                                                                    <div className={`font-semibold ${parseFloat(testResults.change_percent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                        {testResults.change_percent}%
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-slate-400">Confidence</div>
                                                                    <div className="text-white font-semibold">
                                                                        {((testResults.confidence || 0) * 100).toFixed(0)}%
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-slate-400">Decision Score</div>
                                                                    <div className="text-white font-semibold">
                                                                        {(testResults.decision_score || 0).toFixed(2)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Individual Model Analysis */}
                                                        {testResults.analyses && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {Object.entries(testResults.analyses).map(([modelType, analysis]) => (
                                                                    <div key={modelType} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <h4 className="font-semibold text-white capitalize">
                                                                                {modelType} Analysis
                                                                            </h4>
                                                                            <Badge variant="outline" className="text-slate-300 border-slate-600">
                                                                                {((analysis.confidence || 0) * 100).toFixed(0)}%
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-slate-300 text-sm mb-2">
                                                                            {analysis.analysis}
                                                                        </p>
                                                                        <div className="text-xs text-slate-400">
                                                                            Recommendation: <span className="text-white">{analysis.action || analysis.sentiment || analysis.trend}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Ensemble Info */}
                                                        {testResults.ensemble && (
                                                            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                                                <div className="text-blue-400 text-sm font-medium mb-1">
                                                                    Ensemble Analysis
                                                                </div>
                                                                <div className="text-slate-300 text-sm">
                                                                    {testResults.ensemble.models_responded}/{testResults.ensemble.models_total} models responded •
                                                                    Agreement: {testResults.ensemble.agreement_level}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="text-xs text-slate-500 text-center">
                                                            Analysis completed at {new Date(testResults.timestamp).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Quick Test Buttons */}
                                        <div className="border-t border-slate-700 pt-4">
                                            <div className="text-sm text-slate-400 mb-3">Quick Tests:</div>
                                            <div className="flex flex-wrap gap-2">
                                                {['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META'].map(symbol => (
                                                    <Button
                                                        key={symbol}
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setTestSymbol(symbol);
                                                            setTimeout(() => testInvestmentDecision(), 100);
                                                        }}
                                                        disabled={testLoading}
                                                        className="text-slate-300 border-slate-600 hover:bg-slate-800"
                                                    >
                                                        {symbol}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                            <CardContent className="p-8 text-center">
                                <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">Select a model to view details</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Real-time Metrics */}
            {realTimeData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Activity className="w-5 h-5" />
                                Live Performance Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={realTimeData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="time" stroke="#64748b" />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="response_time"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            name="Response Time (s)"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="success_rate"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            name="Success Rate (%)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Server className="w-5 h-5" />
                                Request Volume & Queue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={realTimeData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="time" stroke="#64748b" />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Bar dataKey="requests" fill="#3b82f6" name="Requests" />
                                        <Bar dataKey="queue_length" fill="#f59e0b" name="Queue Length" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default LLMMonitor;
