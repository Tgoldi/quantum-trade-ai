// TradingView Mini Chart Widget (Lightweight)
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const TradingViewMiniChart = ({ symbol, width = '100%', height = 300 }) => {
    const container = useRef(null);

    useEffect(() => {
        if (!container.current) return;

        // Clear previous widget
        container.current.innerHTML = '';

        // Create new widget
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbol: symbol || 'NASDAQ:AAPL',
            width: width,
            height: height,
            locale: 'en',
            dateRange: '12M',
            colorTheme: 'dark',
            trendLineColor: 'rgba(41, 98, 255, 1)',
            underLineColor: 'rgba(41, 98, 255, 0.3)',
            underLineBottomColor: 'rgba(41, 98, 255, 0)',
            isTransparent: false,
            autosize: false,
            largeChartUrl: ''
        });

        container.current.appendChild(script);

        return () => {
            if (container.current) {
                container.current.innerHTML = '';
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

