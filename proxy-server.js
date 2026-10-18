// Simple proxy server for RunPod
// Proxies /api requests to backend and serves frontend

import express from 'express';
import http from 'http';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 8080;
const BACKEND_PORT = 3002;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

// Security middleware
app.use(helmet());

// NOTE: body parsers are intentionally NOT applied before the /api proxy so the
// raw request stream can be piped through to the backend unchanged.

// Proxy API requests to backend
app.use('/api', async (req, res) => {
    // Express strips /api from req.url, so we need to add it back
    const backendPath = `/api${req.url}`; // Add /api prefix back
    const targetUrl = `${BACKEND_URL}${backendPath}`;
    console.log(`[PROXY] ${req.method} ${req.url} -> ${targetUrl}`);
    
    // Explicit allow-list of forwarded headers (no client-supplied X-Forwarded-* / hop-by-hop headers)
    const forwardedHeaders = {};
    for (const name of ['authorization', 'content-type', 'accept', 'accept-language', 'user-agent']) {
        if (req.headers[name] !== undefined) {
            forwardedHeaders[name] = req.headers[name];
        }
    }
    // Preserve original framing headers since the body is streamed through unchanged
    for (const name of ['content-length', 'transfer-encoding']) {
        if (req.headers[name] !== undefined) {
            forwardedHeaders[name] = req.headers[name];
        }
    }
    forwardedHeaders['x-forwarded-for'] = req.socket.remoteAddress || '';

    const options = {
        hostname: 'localhost',
        port: BACKEND_PORT,
        path: backendPath, // /api/health, /api/auth/register, etc.
        method: req.method,
        headers: forwardedHeaders
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
        // Copy CORS headers from backend response
        const headers = { ...proxyRes.headers };
        res.writeHead(proxyRes.statusCode, headers);
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
        console.error('[PROXY ERROR]', err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Something went wrong' });
        } else {
            res.end();
        }
    });
    
    // Stream the original request body through unchanged (any content type)
    req.on('error', () => proxyReq.destroy());
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

