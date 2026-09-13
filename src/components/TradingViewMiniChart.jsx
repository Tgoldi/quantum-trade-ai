// TradingView Mini Chart Widget (Lightweight)
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const TradingViewMiniChart = ({ symbol, width = '100%', height = 300 }) => {
    const container = useRef(null);

    useEffect(() => {
        if (!container.current) return;

        // Clear previous widget
        while (container.current.firstChild) {
            container.current.removeChild(container.current.firstChild);
        }

        // Create widget container div
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        
        // Store configuration in data attributes for TradingView's external script to read
        widgetDiv.setAttribute('data-symbol', symbol || 'NASDAQ:AAPL');
        widgetDiv.setAttribute('data-width', width);
        widgetDiv.setAttribute('data-height', height);
        widgetDiv.setAttribute('data-locale', 'en');
        widgetDiv.setAttribute('data-dateRange', '12M');
        widgetDiv.setAttribute('data-colorTheme', 'dark');
        widgetDiv.setAttribute('data-trendLineColor', 'rgba(41, 98, 255, 1)');
        widgetDiv.setAttribute('data-underLineColor', 'rgba(41, 98, 255, 0.3)');
        widgetDiv.setAttribute('data-underLineBottomColor', 'rgba(41, 98, 255, 0)');
        widgetDiv.setAttribute('data-isTransparent', 'false');
        widgetDiv.setAttribute('data-autosize', 'false');
        widgetDiv.setAttribute('data-largeChartUrl', '');

        container.current.appendChild(widgetDiv);

        // Load the external script separately
        const externalScript = document.createElement('script');
        externalScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
        externalScript.async = true;
        document.body.appendChild(externalScript);

        return () => {
            if (container.current) {
                while (container.current.firstChild) {
                    container.current.removeChild(container.current.firstChild);
                }
            }
            if (document.body.contains(externalScript)) {
                document.body.removeChild(externalScript);
            }
        };
    }, [symbol, width, height]);

    return (
        <div className="tradingview-widget-container" ref={container}>
            <div className="tradingview-widget-container__widget"></div>
        </div>
    );
};

TradingViewMiniChart.propTypes = {
    symbol: PropTypes.string.isRequired,
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.number
};

export default TradingViewMiniChart;

