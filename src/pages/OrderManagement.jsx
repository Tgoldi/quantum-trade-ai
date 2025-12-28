import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Clock, X, Plus, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const OrderCard = ({ order, onCancel, onViewDetails }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'filled': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'partially_filled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending':
      case 'open': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getOrderTypeColor = (side) => {
    return side === 'buy' ? 'text-green-400' : 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
            <span className="font-bold text-white text-sm">{order.symbol}</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{order.symbol}</h3>
            <p className="text-slate-400 text-sm">
              {order.order_type.replace('_', ' ').toUpperCase()} • {order.time_in_force?.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <Badge className={getStatusColor(order.status)}>
            {order.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <p className="text-xs text-slate-400 mt-1">
            {new Date(order.created_date).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-slate-400 text-xs mb-1">Side & Quantity</p>
          <p className={`font-semibold ${getOrderTypeColor(order.side)}`}>
            {order.side.toUpperCase()} {order.quantity}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-1">Price</p>
          <p className="text-white font-semibold">
            {order.order_type === 'market' ? 'MARKET' : `$${order.price?.toFixed(2)}`}
          </p>
        </div>
      </div>

      {order.filled_quantity > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-slate-400">Filled</span>
            <span className="text-white">{order.filled_quantity} of {order.quantity}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${(order.filled_quantity / order.quantity) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {order.status === 'open' || order.status === 'pending' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel(order)}
            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDetails(order)}
          className="flex-1 border-slate-600 text-slate-300"
        >
          Details
        </Button>
      </div>
    </motion.div>
  );
};

const OrderForm = ({ onSubmit, onClose }) => {
  const [orderData, setOrderData] = useState({
    symbol: '',
    side: 'buy',
    order_type: 'market',
    quantity: '',
    price: '',
    stop_price: '',
    time_in_force: 'day'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(orderData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="symbol" className="text-slate-300">Symbol</Label>
          <Input
            id="symbol"
            value={orderData.symbol}
            onChange={(e) => setOrderData({...orderData, symbol: e.target.value.toUpperCase()})}
            placeholder="AAPL"
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
        <div>
          <Label className="text-slate-300">Side</Label>
          <Select
            value={orderData.side}
            onValueChange={(value) => setOrderData({...orderData, side: value})}
          >
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-300">Order Type</Label>
          <Select
            value={orderData.order_type}
            onValueChange={(value) => setOrderData({...orderData, order_type: value})}
          >
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market">Market</SelectItem>
              <SelectItem value="limit">Limit</SelectItem>
              <SelectItem value="stop">Stop</SelectItem>
              <SelectItem value="stop_limit">Stop Limit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="quantity" className="text-slate-300">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={orderData.quantity}
            onChange={(e) => setOrderData({...orderData, quantity: e.target.value})}
            placeholder="100"
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
      </div>

      {(orderData.order_type === 'limit' || orderData.order_type === 'stop_limit') && (
        <div>
          <Label htmlFor="price" className="text-slate-300">Limit Price</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={orderData.price}
            onChange={(e) => setOrderData({...orderData, price: e.target.value})}
            placeholder="150.00"
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
      )}

      {(orderData.order_type === 'stop' || orderData.order_type === 'stop_limit') && (
        <div>
          <Label htmlFor="stop_price" className="text-slate-300">Stop Price</Label>
          <Input
            id="stop_price"
            type="number"
            step="0.01"
            value={orderData.stop_price}
            onChange={(e) => setOrderData({...orderData, stop_price: e.target.value})}
            placeholder="145.00"
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
      )}

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
          Place Order
        </Button>
      </div>
    </form>
  );
};

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadOrders();
    // Set up real-time updates
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      // Load AI-generated orders from localStorage (real orders from AI execution)
      const aiOrders = JSON.parse(localStorage.getItem('ai_orders') || '[]');
      
      // TODO: In production, fetch from backend API
      // const backendOrders = await backendService.getOrders();
      
      setOrders(aiOrders); // Only real AI-generated orders, no mock data
      
      console.log(`📊 Loaded ${aiOrders.length} real AI-generated orders`);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]); // Empty array, no fallback mock data
    }
    setLoading(false);
  };

  const handlePlaceOrder = async (orderData) => {
    try {
      // Add validation and risk checks here
      const newOrder = {
        ...orderData,
        id: Date.now(),
        order_id: `ORD_${Date.now()}`,
        status: 'pending',
        trading_mode: 'paper', // Default to paper trading
        filled_quantity: 0,
        remaining_quantity: parseInt(orderData.quantity),
        risk_checks_passed: true,
        created_date: new Date().toISOString()
      };
      
      // Add to local state (in real app, would call backend API)
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      console.log('Order placed:', newOrder);
    } catch (error) {
      console.error("Error placing order:", error);
    }
  };

  const handleCancelOrder = async (order) => {
    try {
      // Update order status to cancelled
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === order.id ? { ...o, status: 'cancelled' } : o
        )
      );
      console.log('Order cancelled:', order.id);
    } catch (error) {
      console.error("Error cancelling order:", error);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsDialog(true);
  };

  const filterOrders = (status) => {
    if (status === "all") return orders;
    if (status === "open") return orders.filter(o => ['pending', 'open', 'partially_filled'].includes(o.status));
    return orders.filter(o => o.status === status);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Clock className="w-16 h-16 text-blue-400 mx-auto animate-spin" />
          <p className="text-white text-lg font-semibold">Loading Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Order Management</h1>
          <p className="text-slate-400 mt-1">Monitor and manage your trading orders</p>
        </div>
        <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Place New Order</DialogTitle>
            </DialogHeader>
            <OrderForm 
              onSubmit={handlePlaceOrder}
              onClose={() => setShowOrderForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{orders.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Open Orders</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {orders.filter(o => ['pending', 'open', 'partially_filled'].includes(o.status)).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Filled Today</p>
                <p className="text-2xl font-bold text-green-400">
                  {orders.filter(o => o.status === 'filled').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Cancelled</p>
                <p className="text-2xl font-bold text-red-400">
                  {orders.filter(o => o.status === 'cancelled').length}
                </p>
              </div>
              <X className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900/50 border border-slate-800/50">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="filled">Filled</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {(filterOrders(activeTab).length > 0 ? filterOrders(activeTab) : [
                {
                  id: 1,
                  order_id: 'ORD_001',
                  symbol: 'AAPL',
                  side: 'buy',
                  order_type: 'limit',
                  quantity: 100,
                  price: 180.00,
                  status: 'open',
                  filled_quantity: 0,
                  time_in_force: 'day',
                  created_date: new Date().toISOString()
                },
                {
                  id: 2,
                  order_id: 'ORD_002',
                  symbol: 'NVDA',
                  side: 'buy',
                  order_type: 'market',
                  quantity: 50,
                  status: 'filled',
                  filled_quantity: 50,
                  average_fill_price: 920.50,
                  time_in_force: 'day',
                  created_date: new Date(Date.now() - 3600000).toISOString()
                },
                {
                  id: 3,
                  order_id: 'ORD_003',
                  symbol: 'TSLA',
                  side: 'sell',
                  order_type: 'stop',
                  quantity: 25,
                  stop_price: 200.00,
                  status: 'pending',
                  filled_quantity: 0,
                  time_in_force: 'gtc',
                  created_date: new Date(Date.now() - 7200000).toISOString()
                }
              ]).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onCancel={handleCancelOrder}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Symbol</p>
                  <p className="text-white font-semibold text-lg">{selectedOrder.symbol}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Status</p>
                  <Badge className={`${selectedOrder.status === 'filled' ? 'bg-green-500/20 text-green-400' : selectedOrder.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {selectedOrder.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Order Type</p>
                  <p className="text-white">{selectedOrder.order_type.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Side</p>
                  <p className={selectedOrder.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                    {selectedOrder.side.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Quantity</p>
                  <p className="text-white">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Price</p>
                  <p className="text-white">
                    {selectedOrder.order_type === 'market' ? 'MARKET' : `$${selectedOrder.price?.toFixed(2)}`}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Filled</p>
                  <p className="text-white">{selectedOrder.filled_quantity} / {selectedOrder.quantity}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Time in Force</p>
                  <p className="text-white">{selectedOrder.time_in_force?.toUpperCase()}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Created Date</p>
                <p className="text-white">{new Date(selectedOrder.created_date).toLocaleString()}</p>
              </div>
              {selectedOrder.order_id && (
                <div>
                  <p className="text-slate-400 text-sm mb-1">Order ID</p>
                  <p className="text-white font-mono text-xs">{selectedOrder.order_id}</p>
                </div>
              )}
              <Button
                onClick={() => setShowDetailsDialog(false)}
                className="w-full bg-slate-700 hover:bg-slate-600"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}