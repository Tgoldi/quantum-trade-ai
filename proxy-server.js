// Simple proxy server for RunPod
// Proxies /api requests to backend and serves frontend

import express from 'express';
import http from 'http';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
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
    // Express strips /api from req.url, so we need to add it back
    const backendPath = `/api${req.url}`; // Add /api prefix back
    const targetUrl = `${BACKEND_URL}${backendPath}`;
    console.log(`[PROXY] ${req.method} ${req.url} -> ${targetUrl}`);
    
    const options = {
        hostname: 'localhost',
        port: BACKEND_PORT,
        path: backendPath, // /api/health, /api/auth/register, etc.
        method: req.method,
        headers: {
            ...req.headers,
            host: `localhost:${BACKEND_PORT}`,
        }
    };
    
    // Remove host header to avoid issues
    delete options.headers['host'];
    
    const proxyReq = http.request(options, (proxyRes) => {
        // Copy CORS headers from backend response
        const headers = { ...proxyRes.headers };
        res.writeHead(proxyRes.statusCode, headers);
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
        console.error('[PROXY ERROR]', err.message);
        res.status(500).json({ error: 'Backend proxy error', message: err.message });
    });
    
    // Forward request body for POST/PUT requests
    if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
    
    // End the request
    proxyReq.end();
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

// Create HTTP server
const server = createServer(app);

// WebSocket proxy for /ws endpoint
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (clientWs, req) => {
    console.log('[WS PROXY] Client connected');
    
    // Connect to backend WebSocket
    const backendWs = new WebSocket(`ws://localhost:${BACKEND_PORT}/ws`);
    
    backendWs.on('open', () => {
        console.log('[WS PROXY] Connected to backend WebSocket');
    });
    
    // Forward messages from client to backend
    clientWs.on('message', (message) => {
        if (backendWs.readyState === WebSocket.OPEN) {
            backendWs.send(message);
        }
    });
    
    // Forward messages from backend to client
    backendWs.on('message', (message) => {
        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(message);
        }
    });
    
    // Handle disconnections
    clientWs.on('close', () => {
        console.log('[WS PROXY] Client disconnected');
        backendWs.close();
    });
    
    backendWs.on('close', () => {
        console.log('[WS PROXY] Backend disconnected');
        clientWs.close();
    });
    
    backendWs.on('error', (err) => {
        console.error('[WS PROXY] Backend error:', err.message);
        clientWs.close();
    });
    
    clientWs.on('error', (err) => {
        console.error('[WS PROXY] Client error:', err.message);
        backendWs.close();
    });
});

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        🚀 Quantum Trade AI - Proxy Server 🚀            ║
║                                                          ║
║  Frontend:      http://localhost:${PORT}              ║
║  Backend Proxy: http://localhost:${PORT}/api -> :${BACKEND_PORT} ║
║  WebSocket:     ws://localhost:${PORT}/ws -> :${BACKEND_PORT} ║
║  Status:        ✅ RUNNING                            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
});

