const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const monitoringMiddleware = require('./monitoring');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Injected Monitoring Middleware — transmits metrics to http://localhost:5000/api/hit
app.use(monitoringMiddleware({
    serviceName: process.env.SERVICE_NAME || 'store-api',
    enableLogging: true
}));

// In-memory catalog
const products = [
    { id: 1, name: 'Cloud Monitor Agent', price: 49.99, inStock: true },
    { id: 2, name: 'APM Enterprise License', price: 299.99, inStock: true },
    { id: 3, name: 'Log Aggregator Pro', price: 89.99, inStock: false },
    { id: 4, name: 'Webhook Dispatcher', price: 19.99, inStock: true }
];

// 1. List all products
app.get('/api/products', (req, res) => {
    // Simulated DB query latency (30 - 100ms)
    const latency = Math.floor(Math.random() * 70) + 30;
    setTimeout(() => {
        res.json({
            success: true,
            count: products.length,
            data: products
        });
    }, latency);
});

// 2. Get single product by ID
app.get('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const product = products.find(p => p.id === id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: `Product with ID ${id} not found`
        });
    }

    res.json({ success: true, data: product });
});

// 3. Create order
app.post('/api/orders', (req, res) => {
    const { productId, quantity = 1 } = req.body || {};
    const product = products.find(p => p.id === parseInt(productId, 10));

    if (!product) {
        return res.status(400).json({
            success: false,
            message: 'Invalid productId'
        });
    }

    res.status(201).json({
        success: true,
        orderId: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        product: product.name,
        quantity,
        total: (product.price * quantity).toFixed(2),
        status: 'confirmed'
    });
});

// 4. Endpoint that throws simulated error (to test error rate monitoring)
app.get('/api/error', (req, res) => {
    res.status(500).json({
        success: false,
        error: 'Simulated downstream service failure',
        code: 'ERR_SERVICE_DOWN'
    });
});

// 5. Health endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'store-api',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Store API running on http://localhost:${PORT}`);
    console.log(`📊 Monitoring telemetry target: ${process.env.MONITORING_ENDPOINT || 'http://localhost:5000/api/hit'}`);
    console.log(`🔑 Using API Key: ${(process.env.MONITORING_API_KEY || '').slice(0, 15)}...`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET  http://localhost:${PORT}/api/products`);
    console.log(`  GET  http://localhost:${PORT}/api/products/1`);
    console.log(`  GET  http://localhost:${PORT}/api/products/999  (404 test)`);
    console.log(`  POST http://localhost:${PORT}/api/orders        (201 test)`);
    console.log(`  GET  http://localhost:${PORT}/api/error         (500 test)`);
});
