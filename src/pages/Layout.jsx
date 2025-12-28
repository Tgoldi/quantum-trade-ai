
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { createPageUrl } from "@/utils";
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, 
  BarChart3, 
  Wallet, 
  Brain, 
  Activity, 
  Shield,
  Target,
  Bell,
  Settings,
  Calculator,
  Eye,
  DollarSign,
  Search,
  ChevronLeft,
  Home,
  Sparkles,
  Plus,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import "../components/navbar-enhancements.css";


const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: BarChart3,
    badge: null,
    shortcut: "⌘D",
    description: "Overview of your trading performance",
    category: "main"
  },
  {
    title: "Portfolio",
    url: createPageUrl("Portfolio"),
    icon: Wallet,
    badge: "Updated",
    shortcut: "⌘P",
    description: "Manage your investment portfolio",
    category: "main"
  },
  {
    title: "AI Trading",
    url: createPageUrl("AITrading"),
    icon: Brain,
    badge: "AI",
    shortcut: "⌘A",
    description: "Automated AI-powered trading",
    category: "ai"
  },
  {
    title: "Orders",
    url: createPageUrl("OrderManagement"),
    icon: DollarSign,
    badge: "3",
    shortcut: "⌘O",
    description: "Manage your trading orders",
    category: "trading"
  },
  {
    title: "Charts",
    url: createPageUrl("AdvancedChart"),
    icon: TrendingUp,
    badge: "Pro",
    shortcut: "⌘C",
    description: "Advanced TradingView charts",
    category: "analysis"
  },
  {
    title: "Watchlists",
    url: createPageUrl("Watchlists"),
    icon: Eye,
    badge: "12",
    shortcut: "⌘W",
    description: "Track your favorite stocks",
    category: "main"
  },
  {
    title: "Options",
    url: createPageUrl("OptionsTrading"),
    icon: Calculator,
    badge: null,
    shortcut: "⌘T",
    description: "Options trading and strategies",
    category: "trading"
  },
  {
    title: "Analytics",
    url: createPageUrl("AdvancedAnalytics"),
    icon: Activity,
    badge: "Pro",
    shortcut: "⌘L",
    description: "Advanced market analytics",
    category: "analysis"
  },
  {
    title: "LLM Monitor",
    url: createPageUrl("LLMMonitoring"),
    icon: Brain,
    badge: "AI",
    shortcut: "⌘M",
    description: "Monitor LLM performance and parameters",
    category: "ai"
  },
  {
    title: "Risk Management",
    url: createPageUrl("RiskManagement"),
    icon: Shield,
    badge: null,
    shortcut: "⌘R",
    description: "Monitor and manage risk",
    category: "analysis"
  },
  {
    title: "Backtesting",
    url: createPageUrl("Backtesting"),
    icon: Target,
    badge: null,
    shortcut: "⌘B",
    description: "Test your trading strategies",
    category: "analysis"
  },
  {
    title: "Alerts",
    url: createPageUrl("Alerts"),
    icon: Bell,
    badge: "5",
    shortcut: "⌘N",
    description: "Price alerts and notifications",
    category: "main"
  }
];

// Quick actions for the navbar
const quickActions = [
  { title: "New Order", icon: Plus, action: "newOrder" },
  { title: "Quick Search", icon: Search, action: "search" },
  { title: "AI Insights", icon: Sparkles, action: "aiInsights" }
];

// Simplified Navigation Component
function EnhancedNavigation({ location, isCollapsed }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState(navigationItems);

  useEffect(() => {
    const filtered = navigationItems.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchQuery]);

  const getBadgeVariant = (badge) => {
    if (!badge) return null;
    if (badge === "AI" || badge === "Pro") return "default";
    if (Number.isInteger(parseInt(badge))) return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-3">
      {/* Simplified Search Bar */}
      {!isCollapsed && (
        <div className="px-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-slate-200 placeholder-slate-500 pl-9 h-9 focus:border-blue-500/50 focus:bg-slate-900"
            />
          </div>
        </div>
      )}

      {/* Simplified Navigation Items */}
      <div className={cn(
        "space-y-1",
        isCollapsed ? "px-2 flex flex-col items-center" : "px-2"
      )}>
        {filteredItems.map((item) => (
          <TooltipProvider key={item.title}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
                  <Link
                    to={item.url}
                    className={cn(
                      "group flex items-center rounded-lg transition-all relative",
                      isCollapsed 
                        ? "justify-center p-2.5 w-11 h-11" 
                        : "gap-3 px-3 py-2.5 w-full",
                      location.pathname === item.url
                        ? 'bg-blue-600/15 text-blue-100'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    )}
                  >
                    {/* Simplified Active indicator */}
                    {location.pathname === item.url && !isCollapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r" />
                    )}

                    <div className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center" : "gap-3 flex-1 min-w-0"
                    )}>
                      <item.icon className={cn(
                        "w-5 h-5 flex-shrink-0",
                        location.pathname === item.url ? 'text-blue-400' : 'text-slate-500'
                      )} />

                      {!isCollapsed && (
                        <>
                          <span className="font-medium text-sm flex-1 truncate">
                            {item.title}
                          </span>
                          
                          {item.badge && (
                            <Badge
                              variant={getBadgeVariant(item.badge)}
                              className={cn(
                                "text-xs px-1.5 py-0 h-5 rounded-md",
                                getBadgeVariant(item.badge) === "destructive" && "bg-red-500/20 text-red-400 border-red-500/30",
                                getBadgeVariant(item.badge) === "default" && "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </Link>
                </SidebarMenuItem>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent
                  side="right"
                  className="bg-slate-800 border-slate-700"
                >
                  <span className="text-sm font-medium">{item.title}</span>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Simplified Quick Actions */}
      {!isCollapsed && (
        <div className="px-2 pt-3 border-t border-slate-800/50">
          <div className="space-y-1">
            {quickActions.map((action) => (
              <button
                key={action.title}
                className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
              >
                <action.icon className="w-4 h-4" />
                <span className="text-sm">{action.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LayoutContent({ children }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuth();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey) {
        const shortcutMap = {
          'd': 'Dashboard',
          'p': 'Portfolio',
          'a': 'AITrading',
          'o': 'OrderManagement',
          'c': 'TechnicalAnalysis',
          'w': 'Watchlists',
          't': 'OptionsTrading',
          'l': 'AdvancedAnalytics',
          'm': 'LLMMonitoring',
          'r': 'RiskManagement',
          'b': 'Backtesting',
          'n': 'Alerts'
        };

        const page = shortcutMap[e.key.toLowerCase()];
        if (page) {
          e.preventDefault();
          window.location.href = createPageUrl(page);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SidebarProvider>
      <div className={cn(
        "layout-container bg-slate-950 text-slate-200",
        isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"
      )}>
        <style>{`
          /* Simplified layout styles */
          .layout-container {
            display: flex;
            min-height: 100vh;
            width: 100%;
          }
          
          .main-content {
            flex: 1;
            min-width: 0;
            overflow-x: auto;
          }
        `}</style>
        
        <Sidebar 
          className={cn(
            "border-r border-slate-800 bg-slate-950 flex flex-col transition-all duration-300",
            "hidden md:flex", // Hide on mobile, show on tablet and up
            isCollapsed ? "w-14" : "md:w-60 lg:w-64 xl:w-72"
          )}
          style={{ backgroundColor: '#020617' }}
        >
          <SidebarHeader className={cn(
            "border-b border-slate-800/50",
            isCollapsed ? "p-3" : "p-4"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                {!isCollapsed && (
                  <div>
                    <h2 className="font-bold text-base text-slate-100">
                      QuantumTrade
                    </h2>
                    <p className="text-xs text-slate-500">
                      AI Trading Platform
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-8 h-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              >
                <ChevronLeft className={cn(
                  "w-4 h-4 transition-transform",
                  isCollapsed && "rotate-180"
                )} />
              </Button>
            </div>
          </SidebarHeader>

          <SidebarContent className="flex-1 py-4 bg-slate-950">
            <SidebarGroup className="bg-slate-950">
              <EnhancedNavigation
                location={location}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
              />
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className={cn(
            "border-t border-slate-800/50",
            isCollapsed ? "p-2" : "p-3"
          )}>
            <div className={cn(
              "flex items-center rounded-lg p-2 hover:bg-slate-800/50 transition-colors cursor-pointer",
              isCollapsed ? "justify-center" : "justify-between"
            )}>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
                  <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">AI</AvatarFallback>
                </Avatar>

                {!isCollapsed && (
                  <div className="min-w-0">
                    <p className="font-medium text-slate-200 text-sm truncate">AI Trader</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <p className="text-xs text-slate-500">Active</p>
                    </div>
                  </div>
                )}
              </div>
              
              {!isCollapsed && (
                <div className="flex gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    className="w-7 h-7 rounded-md hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => logout()}
                    className="w-7 h-7 rounded-md hover:bg-red-700/50 text-slate-400 hover:text-red-200"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="main-content flex flex-col min-w-0 flex-1">
          {/* Mobile Header - Only visible on mobile */}
          <header className="bg-slate-950 border-b border-slate-800/50 px-3 py-2.5 md:hidden sticky top-0 z-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="text-slate-400 hover:text-slate-200 -ml-1" />
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h1 className="text-sm font-bold text-slate-100">
                    QuantumTrade
                  </h1>
                </div>
              </div>

              <Button 
                size="icon" 
                variant="ghost"
                className="w-8 h-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              >
                <Bell className="w-3.5 h-3.5" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            {/* Breadcrumb - Hidden on mobile, responsive on larger screens */}
            <div className="hidden md:block border-b border-slate-800/50 px-4 md:px-6 py-2.5 md:py-3 bg-slate-950/50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Home className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-600 flex-shrink-0">/</span>
                  <span className="text-slate-200 font-medium truncate">
                    {navigationItems.find(item => item.url === location.pathname)?.title || 'Dashboard'}
                  </span>
                </div>
                
                {/* Status indicators - Hidden on tablet, shown on desktop */}
                <div className="hidden lg:flex items-center gap-4 text-xs text-slate-400 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span className="hidden xl:inline">Portfolio: </span>
                    <span className="text-green-400">+2.4%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <span className="hidden xl:inline">AI </span>
                    <span>Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Responsive padding */}
            <div className="w-full p-3 sm:p-4 md:p-5 lg:p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function Layout({ children }) {
  return <LayoutContent>{children}</LayoutContent>;
}

// PropTypes
EnhancedNavigation.propTypes = {
  location: PropTypes.object.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
};

LayoutContent.propTypes = {
  children: PropTypes.node.isRequired,
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
