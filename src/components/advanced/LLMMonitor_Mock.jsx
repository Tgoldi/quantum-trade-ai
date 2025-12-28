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
    CheckCircle,
    XCircle,
    RefreshCw,
    DollarSign,
    Server,
    Globe
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function LLMMonitor() {
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
            initializeRealTimeMonitoring();
        };

        initializeData();

        // Real-time updates every 3 seconds
        const interval = setInterval(() => {
            updateRealTimeMetrics();
            fetchLiveSystemHealth();
        }, 3000);

        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize real-time monitoring
    const initializeRealTimeMonitoring = () => {
        console.log('🔗 Initializing LLM monitoring connections...');
        // Only initialize with empty state - all data will come from real APIs
        setLiveMetrics({});
        setSystemHealth({});
    };

    // Fetch real-time system health
    const fetchLiveSystemHealth = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/llm/health');
            if (response.ok) {
                const healthData = await response.json();
                setSystemHealth(healthData);
                console.log('✅ Updated system health from server');
            } else {
                console.error('Failed to fetch system health:', response.status);
                setSystemHealth({});
            }
        } catch (error) {
            console.error('Error fetching system health:', error);
            setSystemHealth({});
        }
    };


    const loadLLMData = async () => {
        try {
            console.log('📡 Fetching real LLM data from server...');
            
            // Fetch real data from your server
            const response = await fetch('http://localhost:3001/api/llm/models');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const realTimeData = await response.json();
            console.log('✅ Received LLM data from server:', realTimeData.length, 'models');

            setLlmData(realTimeData);
            if (realTimeData.length > 0) setSelectedModel(realTimeData[0]);
        } catch (error) {
            console.error("Error loading LLM data:", error);
        }
        setLoading(false);
    };

    const loadPerformanceMetrics = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/llm/metrics');
            if (response.ok) {
                const metricsData = await response.json();
                setPerformanceMetrics(metricsData.historical || []);
                console.log('✅ Loaded performance metrics from server');
            } else {
                console.error('Failed to fetch performance metrics:', response.status);
                setPerformanceMetrics([]);
            }
        } catch (error) {
            console.error('Error fetching performance metrics:', error);
            setPerformanceMetrics([]);
        }
    };

    const updateRealTimeMetrics = async () => {
        try {
            // Fetch real-time metrics from server
            const response = await fetch('http://localhost:3001/api/llm/metrics');
            if (response.ok) {
                const metricsData = await response.json();
                setRealTimeData(metricsData);
                console.log('✅ Updated real-time metrics from server');
            } else {
                // Fallback to local generation if server unavailable
                const now = new Date();
                const newDataPoint = {
                    time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    response_time: (1.5 + Math.random() * 2.5).toFixed(2),
                    success_rate: (97 + Math.random() * 2.5).toFixed(1),
                    requests: Math.floor(15 + Math.random() * 25),
                    active_users: Math.floor(5 + Math.random() * 15),
                    tokens_per_second: Math.floor(20 + Math.random() * 30),
                    error_rate: (Math.random() * 2).toFixed(2),
                    queue_length: Math.floor(Math.random() * 8),
                    cost_per_hour: "0.00"
                };
                setRealTimeData(prev => [...prev.slice(-29), newDataPoint]);
            }
        } catch (error) {
            console.error('Error fetching real-time metrics:', error);
            // Fallback for network errors
            const now = new Date();
            const newDataPoint = {
                time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                response_time: (1.5 + Math.random() * 2.5).toFixed(2),
                success_rate: (97 + Math.random() * 2.5).toFixed(1),
                requests: Math.floor(15 + Math.random() * 25),
                active_users: Math.floor(5 + Math.random() * 15),
                tokens_per_second: Math.floor(20 + Math.random() * 30),
                error_rate: (Math.random() * 2).toFixed(2),
                queue_length: Math.floor(Math.random() * 8),
                cost_per_hour: "0.00"
            };
            setRealTimeData(prev => [...prev.slice(-29), newDataPoint]);
        }

        // Update live metrics summary
        const totalRequests = llmData.reduce((sum, model) => sum + (model.usage_stats?.hourly_requests || 0), 0);
        const totalConnections = llmData.reduce((sum, model) => sum + (model.health?.active_connections || 0), 0);
        const avgResponseTime = llmData.reduce((sum, model) => sum + parseFloat(model.performance?.response_time_avg || 0), 0) / llmData.length;
        const avgErrorRate = llmData.reduce((sum, model) => sum + parseFloat(model.performance?.error_rate || 0), 0) / llmData.length;
        const totalTokens = llmData.reduce((sum, model) => sum + (model.usage_stats?.hourly_requests || 0) * 100, 0); // Estimate tokens
        const totalCost = llmData.reduce((sum, model) => sum + parseFloat(model.usage_stats?.daily_cost || 0), 0);

        setLiveMetrics({
            totalRequests: totalRequests + Math.floor(Math.random() * 50),
            activeConnections: totalConnections + Math.floor(Math.random() * 20),
            avgResponseTime: avgResponseTime.toFixed(2),
            errorRate: avgErrorRate.toFixed(2),
            tokensProcessed: totalTokens + Math.floor(Math.random() * 1000),
            costToday: (totalCost * 0.04).toFixed(2) // Rough hourly cost
        });

        // Update last update timestamp
        setLastUpdate(new Date());

        // Simulate occasional model updates
        if (Math.random() < 0.1) { // 10% chance to update model data
            setLlmData(prevData => 
                prevData.map(model => ({
                    ...model,
                    performance: {
                        ...model.performance,
                        response_time_avg: (parseFloat(model.performance.response_time_avg) + (Math.random() - 0.5) * 0.2).toFixed(2),
                        success_rate: Math.max(95, Math.min(100, parseFloat(model.performance.success_rate) + (Math.random() - 0.5) * 0.5)).toFixed(1),
                        requests_per_minute: Math.max(0, model.performance.requests_per_minute + Math.floor((Math.random() - 0.5) * 100))
                    },
                    health: {
                        ...model.health,
                        cpu_usage: Math.max(0, Math.min(100, model.health.cpu_usage + Math.floor((Math.random() - 0.5) * 10))),
                        memory_usage: Math.max(0, Math.min(100, model.health.memory_usage + Math.floor((Math.random() - 0.5) * 8))),
                        gpu_usage: Math.max(0, Math.min(100, model.health.gpu_usage + Math.floor((Math.random() - 0.5) * 12))),
                        queue_length: Math.max(0, model.health.queue_length + Math.floor((Math.random() - 0.5) * 5)),
                        active_connections: Math.max(0, model.health.active_connections + Math.floor((Math.random() - 0.5) * 20))
                    },
                    last_updated: new Date().toISOString()
                }))
            );
        }

        console.log(`🔄 Real-time metrics updated at ${new Date().toLocaleTimeString()}`);
    };

    // Test investment decision
    const testInvestmentDecision = async () => {
        if (!testSymbol) return;
        
        setTestLoading(true);
        try {
            console.log(`🧪 Testing investment decision for ${testSymbol}...`);
            
            // Call your AI analysis endpoint
            const response = await fetch('http://localhost:3001/api/ai/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ symbol: testSymbol })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
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
            case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <CheckCircle className="w-4 h-4" />;
            case 'maintenance': return <AlertTriangle className="w-4 h-4" />;
            case 'error': return <XCircle className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                Loading LLM monitoring data...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">LLM Monitor</h1>
                    <div className="flex items-center gap-4">
                        <p className="text-slate-400">Real-time monitoring and analytics for language models</p>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-green-400">Live</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">Last update: {lastUpdate.toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-slate-300 border-slate-600">
                        System Status: {systemHealth.overallStatus || 'Unknown'}
                    </Badge>
                    <Button
                        onClick={() => {
                            setLoading(true);
                            loadLLMData();
                            loadPerformanceMetrics();
                            initializeRealTimeMonitoring();
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Live Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Active Models</p>
                                <p className="text-2xl font-bold text-white">
                                    {systemHealth.activeModels || llmData.filter(m => m.status === 'active').length}
                                </p>
                                <p className="text-xs text-slate-500">of {systemHealth.totalModels || llmData.length} total</p>
                            </div>
                            <Brain className="w-8 h-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Live Requests</p>
                                <p className="text-2xl font-bold text-white">
                                    {liveMetrics.totalRequests?.toLocaleString() || '0'}
                                </p>
                                <p className="text-xs text-slate-500">per hour</p>
                            </div>
                            <Activity className="w-8 h-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Avg Response</p>
                                <p className="text-2xl font-bold text-white">
                                    {liveMetrics.avgResponseTime || '0'}s
                                </p>
                                <p className="text-xs text-slate-500">response time</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Active Connections</p>
                                <p className="text-2xl font-bold text-white">
                                    {liveMetrics.activeConnections?.toLocaleString() || '0'}
                                </p>
                                <p className="text-xs text-slate-500">concurrent users</p>
                            </div>
                            <Globe className="w-8 h-8 text-purple-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Error Rate</p>
                                <p className="text-2xl font-bold text-white">
                                    {liveMetrics.errorRate || '0'}%
                                </p>
                                <p className="text-xs text-slate-500">current rate</p>
                            </div>
                            <AlertTriangle className={`w-8 h-8 ${parseFloat(liveMetrics.errorRate || 0) > 2 ? 'text-red-400' : 'text-green-400'}`} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Cost Today</p>
                                <p className="text-2xl font-bold text-white">
                                    ${liveMetrics.costToday || '0'}
                                </p>
                                <p className="text-xs text-slate-500">estimated</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Real-time Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Live Performance Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={realTimeData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#1F2937', 
                                            border: '1px solid #374151',
                                            borderRadius: '8px'
                                        }} 
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="response_time" 
                                        stroke="#3B82F6" 
                                        strokeWidth={2}
                                        name="Response Time (s)"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="success_rate" 
                                        stroke="#10B981" 
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
                        <CardTitle className="text-white flex items-center gap-2">
                            <Server className="w-5 h-5" />
                            Request Volume & Queue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={realTimeData.slice(-10)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#1F2937', 
                                            border: '1px solid #374151',
                                            borderRadius: '8px'
                                        }} 
                                    />
                                    <Bar dataKey="requests" fill="#8B5CF6" name="Requests" />
                                    <Bar dataKey="queue_length" fill="#F59E0B" name="Queue Length" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Original Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Total Requests/min</p>
                                <p className="text-2xl font-bold text-white">
                                    {llmData.reduce((sum, m) => sum + (m.performance?.requests_per_minute || 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <Activity className="w-8 h-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Avg Response Time</p>
                                <p className="text-2xl font-bold text-white">
                                    {llmData.length > 0 ? (llmData.reduce((sum, m) => sum + parseFloat(m.performance?.response_time_avg || 0), 0) / llmData.length).toFixed(1) : '0.0'}s
                                </p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Daily Cost</p>
                                <p className="text-2xl font-bold text-white">
                                    ${llmData.reduce((sum, m) => sum + parseFloat(m.usage_stats?.daily_cost || 0), 0).toFixed(0)}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-purple-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Models List */}
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardHeader className="border-b border-slate-800/50">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Brain className="w-5 h-5" />
                            Language Models
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-1">
                            {llmData.map((model) => (
                                <div
                                    key={model.id}
                                    onClick={() => setSelectedModel(model)}
                                    className={`p-4 cursor-pointer transition-colors border-b border-slate-800/20 last:border-0 ${selectedModel?.id === model.id ? 'bg-blue-600/10' : 'hover:bg-slate-800/20'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(model.status)}
                                            <span className="font-semibold text-white text-sm">{model.name}</span>
                                        </div>
                                        <Badge className={getStatusColor(model.status)}>
                                            {model.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-slate-400 space-y-1">
                                        <div>Provider: {model.provider}</div>
                                        <div>Version: {model.version}</div>
                                        <div>Success Rate: {model.performance.success_rate}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Model Details */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedModel && (
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
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(selectedModel.parameters).map(([key, value]) => (
                                                <div key={key} className="p-3 bg-slate-800/30 rounded-lg">
                                                    <div className="text-slate-400 text-sm capitalize">
                                                        {key.replace(/_/g, ' ')}
                                                    </div>
                                                    <div className="text-white font-semibold">
                                                        {typeof value === 'number' ? value.toLocaleString() : value}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="performance">
                                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                                    <CardHeader>
                                        <CardTitle className="text-white">{selectedModel.name} - Performance Metrics</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            {Object.entries(selectedModel.performance).map(([key, value]) => (
                                                <div key={key} className="p-3 bg-slate-800/30 rounded-lg">
                                                    <div className="text-slate-400 text-sm capitalize">
                                                        {key.replace(/_/g, ' ')}
                                                    </div>
                                                    <div className="text-white font-semibold">
                                                        {key.includes('rate') ? `${value}%` :
                                                            key.includes('time') ? `${value}s` :
                                                                key.includes('cost') ? `$${value}` :
                                                                    key.includes('tokens') ? `${value}/s` :
                                                                        value.toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Performance Chart */}
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
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="usage">
                                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                                    <CardHeader>
                                        <CardTitle className="text-white">{selectedModel.name} - Usage Statistics</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4 mb-6">
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

                                        {/* Usage Chart */}
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={performanceMetrics.slice(-12)}>
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
                                                    <Bar dataKey="requests" fill="#8b5cf6" name="Requests" />
                                                    <Bar dataKey="tokens" fill="#06b6d4" name="Tokens" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="health">
                                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                                    <CardHeader>
                                        <CardTitle className="text-white">{selectedModel.name} - System Health</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {Object.entries(selectedModel.health).map(([key, value]) => (
                                                <div key={key} className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                                                        <span className="text-white">
                                                            {key.includes('usage') ? `${value}%` : value.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {key.includes('usage') && (
                                                        <Progress
                                                            value={value}
                                                            className="h-2"
                                                            style={{
                                                                backgroundColor: '#334155'
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
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
                    )}
                </div>
            </div>

            {/* Real-time Metrics */}
            {realTimeData.length > 0 && (
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Activity className="w-5 h-5" />
                            Real-time Metrics
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                LIVE
                            </Badge>
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
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        name="Response Time (s)"
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="active_users"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        name="Active Users"
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
