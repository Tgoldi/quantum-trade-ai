// TradingView Advanced Charting Component
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const TradingViewChart = ({ symbol, interval = 'D', theme = 'dark' }) => {
    const container = useRef(null);
    const scriptRef = useRef(null);

    useEffect(() => {
        // Only load if not already loaded
        if (!window.TradingView && !scriptRef.current) {
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.async = true;
            script.onload = () => initializeWidget();
            document.head.appendChild(script);
            scriptRef.current = script;
        } else if (window.TradingView) {
            initializeWidget();
        }

        return () => {
            // Cleanup
            if (container.current) {
                container.current.innerHTML = '';
            }
        };
    }, [symbol, interval, theme]);

    const initializeWidget = () => {
        if (!window.TradingView || !container.current) return;

        new window.TradingView.widget({
            container_id: container.current.id,
            autosize: true,
            symbol: symbol || 'NASDAQ:AAPL',
            interval: interval,
            timezone: 'Etc/UTC',
            theme: theme,
            style: '1',
            locale: 'en',
            toolbar_bg: '#0a0e27',
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            save_image: false,
            studies: [
                'MASimple@tv-basicstudies',
                'RSI@tv-basicstudies',
                'MACD@tv-basicstudies'
            ],
            show_popup_button: true,
            popup_width: '1000',
            popup_height: '650',
            support_host: 'https://www.tradingview.com'
        });
    };

    return (
        <div
            id={`tradingview_${symbol}`}
            ref={container}
            className="w-full h-full min-h-[500px]"
            style={{ height: '100%' }}
        />
    );
};

TradingViewChart.propTypes = {
    symbol: PropTypes.string.isRequired,
    interval: PropTypes.string,
    theme: PropTypes.oneOf(['light', 'dark'])
};

export default TradingViewChart;


