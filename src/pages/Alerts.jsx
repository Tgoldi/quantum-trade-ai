import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Plus, AlertTriangle, CheckCircle, Clock, Trash2, Edit, Smartphone, Mail, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AlertCard = ({ alert, onToggle, onDelete, onEdit }) => {
  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'price': return '💰';
      case 'volume': return '📊';
      case 'technical': return '📈';
      case 'news': return '📰';
      case 'sentiment': return '😊';
      case 'ai_decision': return '🤖';
      case 'portfolio': return '💼';
      default: return '🔔';
    }
  };

  const getAlertStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getAlertTypeIcon(alert.alert_type)}</div>
          <div>
            <h3 className="text-white font-semibold">{alert.name}</h3>
            <p className="text-slate-400 text-sm">{alert.symbol || 'Portfolio-wide'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getAlertStatusColor(alert.is_active)}>
            {alert.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Switch
            checked={alert.is_active}
            onCheckedChange={() => onToggle(alert)}
            className="scale-75"
          />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Condition:</span>
          <span className="text-white">
            {alert.operator} ${alert.threshold_value}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Notifications:</span>
          <div className="flex gap-1">
            {alert.notification_methods?.includes('push') && <Smartphone className="w-4 h-4 text-blue-400" />}
            {alert.notification_methods?.includes('email') && <Mail className="w-4 h-4 text-green-400" />}
            {alert.notification_methods?.includes('sms') && <MessageSquare className="w-4 h-4 text-purple-400" />}
          </div>
        </div>
        {alert.last_triggered && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Last Triggered:</span>
            <span className="text-cyan-400">
              {new Date(alert.last_triggered).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(alert)}
          className="flex-1 border-slate-600 text-slate-300"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(alert)}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

const CreateAlertForm = ({ onSubmit, onClose, editingAlert = null }) => {
  const [alertData, setAlertData] = useState({
    name: '',
    symbol: '',
    alert_type: 'price',
    operator: 'above',
    threshold_value: '',
    notification_methods: ['push'],
    frequency: 'once',
    expires_at: '',
    is_active: true,
    ...editingAlert
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(alertData);
    onClose();
  };

  const handleNotificationToggle = (method) => {
    setAlertData(prev => ({
      ...prev,
      notification_methods: prev.notification_methods.includes(method)
        ? prev.notification_methods.filter(m => m !== method)
        : [...prev.notification_methods, method]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-slate-300">Alert Name</Label>
          <Input
            id="name"
            value={alertData.name}
            onChange={(e) => setAlertData({...alertData, name: e.target.value})}
            placeholder="Price Alert"
            className="bg-slate-800/50 border-slate-700 text-white"
            required
          />
        </div>
        <div>
          <Label htmlFor="symbol" className="text-slate-300">Symbol (Optional)</Label>
          <Input
            id="symbol"
            value={alertData.symbol}
            onChange={(e) => setAlertData({...alertData, symbol: e.target.value.toUpperCase()})}
            placeholder="AAPL"
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-slate-300">Alert Type</Label>
          <Select
            value={alertData.alert_type}
            onValueChange={(value) => setAlertData({...alertData, alert_type: value})}
          >
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="news">News</SelectItem>
              <SelectItem value="sentiment">Sentiment</SelectItem>
              <SelectItem value="ai_decision">AI Decision</SelectItem>
              <SelectItem value="portfolio">Portfolio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-slate-300">Condition</Label>
          <Select
            value={alertData.operator}
            onValueChange={(value) => setAlertData({...alertData, operator: value})}
          >
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="above">Above</SelectItem>
              <SelectItem value="below">Below</SelectItem>
              <SelectItem value="crosses_above">Crosses Above</SelectItem>
              <SelectItem value="crosses_below">Crosses Below</SelectItem>
              <SelectItem value="changes_by">Changes By</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="threshold" className="text-slate-300">Value</Label>
          <Input
            id="threshold"
            type="number"
            step="0.01"
            value={alertData.threshold_value}
            onChange={(e) => setAlertData({...alertData, threshold_value: e.target.value})}
            placeholder="150.00"
            className="bg-slate-800/50 border-slate-700 text-white"
            required
          />
        </div>
      </div>

      <div>
        <Label className="text-slate-300 mb-3 block">Notification Methods</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={alertData.notification_methods.includes('push')}
              onChange={() => handleNotificationToggle('push')}
              className="sr-only"
            />
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              alertData.notification_methods.includes('push')
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                : 'bg-slate-800/50 border-slate-700 text-slate-400'
            }`}>
              <Smartphone className="w-4 h-4" />
              Push
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={alertData.notification_methods.includes('email')}
              onChange={() => handleNotificationToggle('email')}
              className="sr-only"
            />
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              alertData.notification_methods.includes('email')
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-slate-800/50 border-slate-700 text-slate-400'
            }`}>
              <Mail className="w-4 h-4" />
              Email
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={alertData.notification_methods.includes('sms')}
              onChange={() => handleNotificationToggle('sms')}
              className="sr-only"
            />
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              alertData.notification_methods.includes('sms')
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                : 'bg-slate-800/50 border-slate-700 text-slate-400'
            }`}>
              <MessageSquare className="w-4 h-4" />
              SMS
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-300">Frequency</Label>
          <Select
            value={alertData.frequency}
            onValueChange={(value) => setAlertData({...alertData, frequency: value})}
          >
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="once">Once</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="always">Always</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="expires" className="text-slate-300">Expires (Optional)</Label>
          <Input
            id="expires"
            type="datetime-local"
            value={alertData.expires_at}
            onChange={(e) => setAlertData({...alertData, expires_at: e.target.value})}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
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
          {editingAlert ? 'Update Alert' : 'Create Alert'}
        </Button>
      </div>
    </form>
  );
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      // Simulate loading alerts with mock data
      const mockAlerts = [
        {
          id: 1,
          symbol: "NVDA",
          type: "price",
          condition: "above",
          target_value: 900.00,
          current_value: 920.50,
          message: "NVDA has exceeded $900 price target",
          status: "triggered",
          priority: "high",
          created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          symbol: "AAPL",
          type: "volume",
          condition: "above",
          target_value: 50000000,
          current_value: 45000000,
          message: "AAPL volume spike alert",
          status: "active",
          priority: "medium",
          created_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          symbol: "TSLA",
          type: "price",
          condition: "below",
          target_value: 200.00,
          current_value: 210.25,
          message: "TSLA price drop alert",
          status: "active",
          priority: "low",
          created_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setAlerts(mockAlerts);
    } catch (error) {
      console.error("Error loading alerts:", error);
    }
    setLoading(false);
  };

  const handleCreateAlert = async (alertData) => {
    try {
      if (editingAlert) {
        await AlertEntity.update(editingAlert.id, alertData);
        setEditingAlert(null);
      } else {
        await AlertEntity.create(alertData);
      }
      loadAlerts();
    } catch (error) {
      console.error("Error saving alert:", error);
    }
  };

  const handleToggleAlert = async (alert) => {
    try {
      await AlertEntity.update(alert.id, { is_active: !alert.is_active });
      loadAlerts();
    } catch (error) {
      console.error("Error toggling alert:", error);
    }
  };

  const handleDeleteAlert = async (alert) => {
    try {
      await AlertEntity.delete(alert.id);
      loadAlerts();
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  const handleEditAlert = (alert) => {
    setEditingAlert(alert);
    setShowCreateForm(true);
  };

  // Mock alerts if none exist
  const mockAlerts = alerts.length > 0 ? alerts : [
    {
      id: 1,
      name: "AAPL Price Alert",
      symbol: "AAPL",
      alert_type: "price",
      operator: "above",
      threshold_value: 180,
      is_active: true,
      notification_methods: ["push", "email"],
      frequency: "once",
      last_triggered: null,
      trigger_count: 0
    },
    {
      id: 2,
      name: "Portfolio Drawdown",
      alert_type: "portfolio",
      operator: "below",
      threshold_value: -5,
      is_active: true,
      notification_methods: ["push", "sms"],
      frequency: "always",
      last_triggered: new Date(Date.now() - 86400000).toISOString(),
      trigger_count: 2
    },
    {
      id: 3,
      name: "NVDA Volume Spike",
      symbol: "NVDA",
      alert_type: "volume",
      operator: "above",
      threshold_value: 50000000,
      is_active: false,
      notification_methods: ["push"],
      frequency: "daily",
      last_triggered: null,
      trigger_count: 0
    }
  ];

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bell className="w-16 h-16 text-blue-400 mx-auto animate-pulse" />
          <p className="text-white text-lg font-semibold">Loading Alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Alert Center</h1>
          <p className="text-slate-400 mt-1">Stay informed with custom notifications and alerts</p>
        </div>
        <Dialog 
          open={showCreateForm} 
          onOpenChange={(open) => {
            setShowCreateForm(open);
            if (!open) setEditingAlert(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingAlert ? 'Edit Alert' : 'Create New Alert'}
              </DialogTitle>
            </DialogHeader>
            <CreateAlertForm 
              onSubmit={handleCreateAlert}
              onClose={() => {
                setShowCreateForm(false);
                setEditingAlert(null);
              }}
              editingAlert={editingAlert}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Alerts</p>
                <p className="text-2xl font-bold text-white">{mockAlerts.length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Alerts</p>
                <p className="text-2xl font-bold text-green-400">
                  {mockAlerts.filter(a => a.is_active).length}
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
                <p className="text-slate-400 text-sm">Triggered Today</p>
                <p className="text-2xl font-bold text-orange-400">
                  {mockAlerts.reduce((acc, a) => acc + (a.trigger_count || 0), 0)}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Inactive</p>
                <p className="text-2xl font-bold text-slate-400">
                  {mockAlerts.filter(a => !a.is_active).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Tabs defaultValue="all">
        <TabsList className="bg-slate-900/50 border border-slate-800/50">
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="price">Price</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="ai_decision">AI Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {mockAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onToggle={handleToggleAlert}
                  onDelete={handleDeleteAlert}
                  onEdit={handleEditAlert}
                />
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {mockAlerts.filter(a => a.is_active).map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onToggle={handleToggleAlert}
                  onDelete={handleDeleteAlert}
                  onEdit={handleEditAlert}
                />
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="price" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {mockAlerts.filter(a => a.alert_type === 'price').map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onToggle={handleToggleAlert}
                  onDelete={handleDeleteAlert}
                  onEdit={handleEditAlert}
                />
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {mockAlerts.filter(a => a.alert_type === 'portfolio').map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onToggle={handleToggleAlert}
                  onDelete={handleDeleteAlert}
                  onEdit={handleEditAlert}
                />
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="ai_decision" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {mockAlerts.filter(a => a.alert_type === 'ai_decision').map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onToggle={handleToggleAlert}
                  onDelete={handleDeleteAlert}
                  onEdit={handleEditAlert}
                />
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}