// Advanced Charting Page with TradingView
import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, TrendingUp } from 'lucide-react';
import TradingViewChart from '../components/TradingViewChart';

const AdvancedChart = () => {
    const [symbol, setSymbol] = useState('NASDAQ:AAPL');
    const [searchInput, setSearchInput] = useState('AAPL');
    const [interval, setInterval] = useState('D');

    const handleSearch = () => {
        // Convert simple symbol to TradingView format
        const tvSymbol = searchInput.toUpperCase().includes(':')
            ? searchInput.toUpperCase()
            : `NASDAQ:${searchInput.toUpperCase()}`;
        setSymbol(tvSymbol);
    };

    const popularSymbols = [
        { name: 'Apple', symbol: 'NASDAQ:AAPL' },
        { name: 'NVIDIA', symbol: 'NASDAQ:NVDA' },
        { name: 'Tesla', symbol: 'NASDAQ:TSLA' },
        { name: 'Microsoft', symbol: 'NASDAQ:MSFT' },
        { name: 'Google', symbol: 'NASDAQ:GOOGL' },
        { name: 'Amazon', symbol: 'NASDAQ:AMZN' },
        { name: 'Meta', symbol: 'NASDAQ:META' },
        { name: 'S&P 500', symbol: 'SP:SPX' }
    ];

    const intervals = [
        { label: '1 Minute', value: '1' },
        { label: '5 Minutes', value: '5' },
        { label: '15 Minutes', value: '15' },
        { label: '1 Hour', value: '60' },
        { label: 'Daily', value: 'D' },
        { label: 'Weekly', value: 'W' },
        { label: 'Monthly', value: 'M' }
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">Advanced Charts</h1>
                    <p className="page-description">
                        Professional charting powered by TradingView
                    </p>
                </div>
            </div>

            {/* Controls */}
            <Card className="bg-slate-900/50 border-slate-800/50 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Search symbol (e.g., AAPL, TSLA)"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="bg-slate-800 border-slate-700 text-slate-100 pl-10"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                        <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Load
                        </Button>
                    </div>

                    {/* Interval */}
                    <Select value={interval} onValueChange={setInterval}>
                        <SelectTrigger className="w-full sm:w-40 bg-slate-800 border-slate-700">
                            <SelectValue placeholder="Interval" />
                        </SelectTrigger>
                        <SelectContent>
                            {intervals.map((int) => (
                                <SelectItem key={int.value} value={int.value}>
                                    {int.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Popular Symbols */}
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs text-slate-500 py-2">Popular:</span>
                    {popularSymbols.map((stock) => (
                        <Button
                            key={stock.symbol}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSymbol(stock.symbol);
                                setSearchInput(stock.symbol.split(':')[1]);
                            }}
                            className="text-xs bg-slate-800 border-slate-700 hover:bg-slate-700"
                        >
                            {stock.name}
                        </Button>
                    ))}
                </div>
            </Card>

            {/* Chart */}
            <Card className="bg-slate-900/50 border-slate-800/50 p-0 overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
                <TradingViewChart
                    symbol={symbol}
                    interval={interval}
                    theme="dark"
                />
            </Card>

            {/* Info */}
            <Card className="bg-slate-900/30 border-slate-800/30 p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-100 mb-1">
                            Professional TradingView Charts
                        </h3>
                        <p className="text-xs text-slate-400">
                            Access advanced technical analysis with 100+ indicators, drawing tools, and real-time data.
                            Use the toolbar on the left to add indicators and drawing tools. Click the symbol name to search for other stocks.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AdvancedChart;


