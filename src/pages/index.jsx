import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import AdvancedAnalytics from "./AdvancedAnalytics";

import LLMMonitoring from "./LLMMonitoring";

import Portfolio from "./Portfolio";

import AITrading from "./AITrading";

import Analytics from "./Analytics";

import RiskManagement from "./RiskManagement";

import Backtesting from "./Backtesting";

import OrderManagement from "./OrderManagement";

import TechnicalAnalysis from "./TechnicalAnalysis";

import Watchlists from "./Watchlists";

import Alerts from "./Alerts";

import OptionsTrading from "./OptionsTrading";

import CryptoTrading from "./CryptoTrading";

import SocialTrading from "./SocialTrading";

import NewsCenter from "./NewsCenter";

import MobileApp from "./MobileApp";

import AdvancedChart from "./AdvancedChart";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    AdvancedAnalytics: AdvancedAnalytics,
    
    LLMMonitoring: LLMMonitoring,
    
    Portfolio: Portfolio,
    
    AITrading: AITrading,
    
    Analytics: Analytics,
    
    RiskManagement: RiskManagement,
    
    Backtesting: Backtesting,
    
    OrderManagement: OrderManagement,
    
    TechnicalAnalysis: TechnicalAnalysis,
    
    Watchlists: Watchlists,
    
    Alerts: Alerts,
    
    OptionsTrading: OptionsTrading,
    
    CryptoTrading: CryptoTrading,
    
    SocialTrading: SocialTrading,
    
    NewsCenter: NewsCenter,
    
    MobileApp: MobileApp,
    
    AdvancedChart: AdvancedChart,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/AdvancedAnalytics" element={<AdvancedAnalytics />} />
                
                <Route path="/LLMMonitoring" element={<LLMMonitoring />} />
                
                <Route path="/Portfolio" element={<Portfolio />} />
                
                <Route path="/AITrading" element={<AITrading />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/RiskManagement" element={<RiskManagement />} />
                
                <Route path="/Backtesting" element={<Backtesting />} />
                
                <Route path="/OrderManagement" element={<OrderManagement />} />
                
                <Route path="/TechnicalAnalysis" element={<TechnicalAnalysis />} />
                
                <Route path="/Watchlists" element={<Watchlists />} />
                
                <Route path="/Alerts" element={<Alerts />} />
                
                <Route path="/OptionsTrading" element={<OptionsTrading />} />
                
                <Route path="/CryptoTrading" element={<CryptoTrading />} />
                
                <Route path="/SocialTrading" element={<SocialTrading />} />
                
                <Route path="/NewsCenter" element={<NewsCenter />} />
                
                <Route path="/MobileApp" element={<MobileApp />} />
                
                <Route path="/AdvancedChart" element={<AdvancedChart />} />
                <Route path="/advanced-chart" element={<AdvancedChart />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}