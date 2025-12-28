import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Plus, Star, TrendingUp, TrendingDown, Search, Filter, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const StockRow = ({ stock, onAddToWatchlist, onRemoveFromWatchlist, isInWatchlist }) => {
  const isPositive = stock.change >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
          <span className="font-bold text-white text-sm">{stock.symbol.substring(0, 2)}</span>
        </div>
        <div>
          <h3 className="font-semibold text-white">{stock.symbol}</h3>
          <p className="text-slate-400 text-sm">{stock.name || 'Company Name'}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-white font-semibold">${stock.price?.toFixed(2) || '150.00'}</p>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-sm font-medium">
              {isPositive ? '+' : ''}{stock.change?.toFixed(2) || '2.45'} ({stock.change_percent?.toFixed(2) || '1.67'}%)
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-slate-400 text-sm">Volume</p>
          <p className="text-white font-medium">{((stock.volume || 1500000) / 1000000).toFixed(1)}M</p>
        </div>
        
        <Button
          size="sm"
          variant={isInWatchlist ? "destructive" : "outline"}
          onClick={() => isInWatchlist ? onRemoveFromWatchlist(stock) : onAddToWatchlist(stock)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isInWatchlist ? (
            <>
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

const WatchlistTab = ({ watchlist, stocks, onRemoveStock }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">{watchlist.name}</h2>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            {stocks.length} stocks
          </Badge>
        </div>
        <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
      </div>
      
      <div className="space-y-2">
        <AnimatePresence>
          {stocks.map((stock, index) => (
            <StockRow
              key={stock.symbol}
              stock={stock}
              onRemoveFromWatchlist={() => onRemoveStock(watchlist.id, stock.symbol)}
              isInWatchlist={true}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const CreateWatchlistForm = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      symbols: [],
      is_default: false
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-slate-300 font-semibold block mb-2">Watchlist Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="My Watchlist"
          className="bg-slate-800/50 border-slate-700 text-white"
          required
        />
      </div>
      
      <div>
        <label className="text-slate-300 font-semibold block mb-2">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Optional description"
          className="bg-slate-800/50 border-slate-700 text-white"
        />
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 border-slate-600 text-slate-300"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          Create Watchlist
        </Button>
      </div>
    </form>
  );
};

export default function Watchlists() {
  const [watchlists, setWatchlists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlists();
  }, []);

  const loadWatchlists = async () => {
    try {
      // Simulate loading watchlists with mock data
      const mockWatchlists = [
        {
          id: 1,
          name: "AI & Tech Stocks",
          description: "Leading technology and AI companies",
          symbols: ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN"],
          created_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          stocks: [
            { symbol: "NVDA", price: 920.50, change: 15.30, change_percent: 1.69 },
            { symbol: "AAPL", price: 195.75, change: -2.10, change_percent: -1.06 },
            { symbol: "MSFT", price: 378.25, change: 8.50, change_percent: 2.30 },
            { symbol: "GOOGL", price: 142.80, change: 1.85, change_percent: 1.31 },
            { symbol: "AMZN", price: 155.90, change: -0.75, change_percent: -0.48 }
          ]
        },
        {
          id: 2,
          name: "Growth Stocks",
          description: "High-growth potential companies",
          symbols: ["TSLA", "META", "NFLX", "CRM"],
          created_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          stocks: [
            { symbol: "TSLA", price: 210.25, change: -8.50, change_percent: -3.89 },
            { symbol: "META", price: 485.60, change: 12.40, change_percent: 2.62 },
            { symbol: "NFLX", price: 618.75, change: 5.25, change_percent: 0.86 },
            { symbol: "CRM", price: 285.30, change: 3.80, change_percent: 1.35 }
          ]
        }
      ];
      
      setWatchlists(mockWatchlists);
    } catch (error) {
      console.error("Error loading watchlists:", error);
    }
    setLoading(false);
  };

  const handleCreateWatchlist = async (watchlistData) => {
    try {
      await Watchlist.create(watchlistData);
      loadWatchlists();
    } catch (error) {
      console.error("Error creating watchlist:", error);
    }
  };

  const handleAddStock = async (watchlistId, symbol) => {
    try {
      const watchlist = watchlists.find(w => w.id === watchlistId);
      if (watchlist && !watchlist.symbols.includes(symbol)) {
        await Watchlist.update(watchlistId, {
          symbols: [...watchlist.symbols, symbol]
        });
        loadWatchlists();
      }
    } catch (error) {
      console.error("Error adding stock:", error);
    }
  };

  const handleRemoveStock = async (watchlistId, symbol) => {
    try {
      const watchlist = watchlists.find(w => w.id === watchlistId);
      if (watchlist) {
        await Watchlist.update(watchlistId, {
          symbols: watchlist.symbols.filter(s => s !== symbol)
        });
        loadWatchlists();
      }
    } catch (error) {
      console.error("Error removing stock:", error);
    }
  };

  // Mock stock data for demonstration
  const getStocksForWatchlist = (symbols) => {
    return symbols.map(symbol => ({
      symbol,
      name: `${symbol} Corp`,
      price: 150 + Math.random() * 100,
      change: (Math.random() - 0.5) * 10,
      change_percent: (Math.random() - 0.5) * 5,
      volume: 1000000 + Math.random() * 5000000
    }));
  };

  // Default watchlists if none exist
  const defaultWatchlists = watchlists.length > 0 ? watchlists : [
    {
      id: 1,
      name: "My Favorites",
      description: "Top stock picks",
      symbols: ["AAPL", "NVDA", "MSFT", "GOOGL", "TSLA"],
      is_default: true,
      color: "#3B82F6"
    },
    {
      id: 2,
      name: "Tech Giants",
      description: "Large cap technology stocks",
      symbols: ["AAPL", "MSFT", "GOOGL", "AMZN", "META"],
      is_default: false,
      color: "#8B5CF6"
    },
    {
      id: 3,
      name: "AI & Robotics",
      description: "Artificial intelligence and robotics",
      symbols: ["NVDA", "AMD", "PLTR", "C3AI", "SNOW"],
      is_default: false,
      color: "#22C55E"
    }
  ];

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Eye className="w-16 h-16 text-cyan-400 mx-auto animate-pulse" />
          <p className="text-white text-lg font-semibold">Loading Watchlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Watchlists</h1>
          <p className="text-slate-400 mt-1">Monitor your favorite stocks and market opportunities</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stocks..."
              className="w-48 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Watchlist
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Watchlist</DialogTitle>
              </DialogHeader>
              <CreateWatchlistForm 
                onSubmit={handleCreateWatchlist}
                onClose={() => setShowCreateForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Watchlist Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Watchlists</p>
                <p className="text-2xl font-bold text-white">{defaultWatchlists.length}</p>
              </div>
              <Eye className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Tracked Stocks</p>
                <p className="text-2xl font-bold text-blue-400">
                  {defaultWatchlists.reduce((acc, w) => acc + w.symbols.length, 0)}
                </p>
              </div>
              <Star className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Gainers Today</p>
                <p className="text-2xl font-bold text-green-400">12</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Losers Today</p>
                <p className="text-2xl font-bold text-red-400">3</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Watchlist Tabs */}
      <Tabs defaultValue={defaultWatchlists[0]?.id.toString()}>
        <TabsList className="bg-slate-900/50 border border-slate-800/50 w-full justify-start">
          {defaultWatchlists.map((watchlist) => (
            <TabsTrigger 
              key={watchlist.id} 
              value={watchlist.id.toString()}
              className="flex items-center gap-2"
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: watchlist.color }}
              />
              {watchlist.name}
              <Badge variant="outline" className="text-xs">
                {watchlist.symbols.length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {defaultWatchlists.map((watchlist) => (
          <TabsContent key={watchlist.id} value={watchlist.id.toString()}>
            <WatchlistTab
              watchlist={watchlist}
              stocks={getStocksForWatchlist(watchlist.symbols)}
              onRemoveStock={handleRemoveStock}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}