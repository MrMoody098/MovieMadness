const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
    app.use('/local-downloads', (req, res, next) => {
        const origin = req.headers.origin;
        let sameOrigin = !origin;
        try { if (origin) sameOrigin = new URL(origin).host === req.headers.host; } catch (_) { sameOrigin = false; }
        if (req.headers['sec-fetch-site'] === 'cross-site' || !sameOrigin) {
            res.status(403).json({ error: 'Origin not allowed.' });
            return;
        }
        next();
    });
    app.use('/local-downloads', createProxyMiddleware({
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        pathRewrite: { '^/local-downloads': '' },
        on: {
            proxyReq(proxyReq) { proxyReq.setHeader('Origin', 'http://localhost:3000'); }
        }
    }));
};
