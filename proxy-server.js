// Simple proxy server for RunPod
// Proxies /api requests to backend and serves frontend

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 8080;
const BACKEND_PORT = 3002;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Proxy API requests to backend
app.use('/api', async (req, res) => {
    const targetUrl = `${BACKEND_URL}${req.url}`;
    console.log(`[PROXY] ${req.method} ${req.url} -> ${targetUrl}`);
    
    const options = {
        hostname: 'localhost',
        port: BACKEND_PORT,
        path: req.url,
        method: req.method,
        headers: {
            ...req.headers,
            host: `localhost:${BACKEND_PORT}`,
        }
    };
    
    // Remove host header to avoid issues
    delete options.headers['host'];
    
    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
        console.error('[PROXY ERROR]', err.message);
        res.status(500).json({ error: 'Backend proxy error', message: err.message });
    });
    
    // Forward request body
    if (req.body && Object.keys(req.body).length > 0) {
        proxyReq.write(JSON.stringify(req.body));
    }
    
    req.pipe(proxyReq);
});

// Serve frontend static files (must be before catch-all)
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all non-API, non-static routes
app.use((req, res, next) => {
    // Skip API routes and static file requests
    if (req.path.startsWith('/api') || req.path.startsWith('/assets')) {
        return next();
    }
    // Serve index.html for SPA routing
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        🚀 Quantum Trade AI - Proxy Server 🚀            ║
║                                                          ║
║  Frontend:      http://localhost:${PORT}              ║
║  Backend Proxy: http://localhost:${PORT}/api -> :${BACKEND_PORT} ║
║  Status:        ✅ RUNNING                            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
});

