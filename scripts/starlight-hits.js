/**
 * Starlight Retail — Real-Time API Hit Simulator
 * 
 * Simulates realistic traffic from a retail e-commerce API 
 * being monitored by our system. Shows real-time data in the dashboard.
 * 
 * Run: node scripts/starlight-hits.js [API_KEY] [--continuous]
 * 
 * Args:
 *   API_KEY      - Optional. Falls back to scripts/.starlight-key or env
 *   --continuous - Keep sending hits every 2s (for live demo)
 *   --burst      - Send 100 hits quickly then stop
 */

import { readFileSync, existsSync } from 'fs';

const HIT_URL = 'http://localhost:5000/api/hit';

// Get API key from args, file, or fallback
function getApiKey() {
    const fromArgs = process.argv.find(a => a.startsWith('apim_') || a.startsWith('test'));
    if (fromArgs) return fromArgs;
    const keyFile = 'scripts/.starlight-key';
    if (existsSync(keyFile)) {
        return readFileSync(keyFile, 'utf8').trim();
    }
    return process.env.STARLIGHT_API_KEY || null;
}

const isContinuous = process.argv.includes('--continuous');
const isBurst = process.argv.includes('--burst');

// Realistic Starlight Retail endpoints
const ENDPOINTS = [
    { endpoint: '/api/products',           method: 'GET',    weight: 30, service: 'product-service' },
    { endpoint: '/api/products/:id',       method: 'GET',    weight: 20, service: 'product-service' },
    { endpoint: '/api/products/search',    method: 'GET',    weight: 15, service: 'product-service' },
    { endpoint: '/api/cart',               method: 'GET',    weight: 12, service: 'cart-service' },
    { endpoint: '/api/cart/add',           method: 'POST',   weight: 10, service: 'cart-service' },
    { endpoint: '/api/orders',             method: 'GET',    weight: 8,  service: 'order-service' },
    { endpoint: '/api/orders',             method: 'POST',   weight: 6,  service: 'order-service' },
    { endpoint: '/api/orders/:id/status',  method: 'GET',    weight: 5,  service: 'order-service' },
    { endpoint: '/api/auth/login',         method: 'POST',   weight: 12, service: 'auth-service' },
    { endpoint: '/api/auth/logout',        method: 'POST',   weight: 4,  service: 'auth-service' },
    { endpoint: '/api/customers/profile',  method: 'GET',    weight: 8,  service: 'customer-service' },
    { endpoint: '/api/customers/wishlist', method: 'GET',    weight: 6,  service: 'customer-service' },
    { endpoint: '/api/payments/checkout',  method: 'POST',   weight: 5,  service: 'payment-service' },
    { endpoint: '/api/payments/verify',    method: 'POST',   weight: 3,  service: 'payment-service' },
    { endpoint: '/api/reviews',            method: 'GET',    weight: 7,  service: 'review-service' },
    { endpoint: '/api/reviews',            method: 'POST',   weight: 3,  service: 'review-service' },
    { endpoint: '/api/inventory/check',    method: 'GET',    weight: 9,  service: 'inventory-service' },
    { endpoint: '/api/notifications',      method: 'GET',    weight: 5,  service: 'notification-service' },
];

// Status distribution (realistic retail: mostly 200s)
const STATUS_CODES = [
    { code: 200, weight: 55 },
    { code: 201, weight: 12 },
    { code: 204, weight: 4 },
    { code: 400, weight: 10 },
    { code: 401, weight: 5 },
    { code: 403, weight: 2 },
    { code: 404, weight: 8 },
    { code: 429, weight: 2 },  // rate limit
    { code: 500, weight: 2 },
];

function weightedRandom(items) {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = Math.random() * total;
    for (const item of items) {
        r -= item.weight;
        if (r <= 0) return item;
    }
    return items[items.length - 1];
}

function randomLatency(statusCode) {
    if (statusCode >= 500) return Math.floor(Math.random() * 4000) + 1000;
    if (statusCode === 429) return Math.floor(Math.random() * 50) + 10;
    if (statusCode >= 400) return Math.floor(Math.random() * 150) + 20;
    // Realistic retail latency: 40ms–600ms depending on endpoint
    const base = Math.floor(Math.random() * 400) + 40;
    return base;
}

let hitCount = 0;
let successCount = 0;
let errorCount = 0;

async function sendHit(apiKey) {
    const ep = weightedRandom(ENDPOINTS);
    const status = weightedRandom(STATUS_CODES);
    const latency = randomLatency(status.code);

    const body = {
        endpoint: ep.endpoint,
        method: ep.method,
        statusCode: status.code,
        latencyMs: latency,
        serviceName: ep.service,
    };

    try {
        const res = await fetch(HIT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            body: JSON.stringify(body),
        });

        hitCount++;
        if (res.ok) {
            successCount++;
        } else {
            errorCount++;
            const d = await res.json();
            console.log(`  ⚠️  Hit rejected: ${d.message}`);
        }

        const isError = status.code >= 400;
        const icon = isError ? '🔴' : '🟢';
        const line = `${icon} #${hitCount} ${ep.method.padEnd(6)} ${ep.endpoint.padEnd(30)} → ${status.code} (${latency}ms) [${ep.service}]`;
        process.stdout.write('\r' + line.padEnd(80));
    } catch (err) {
        errorCount++;
        process.stdout.write(`\r❌ Network error: ${err.message}`.padEnd(80));
    }
}

async function printStats() {
    const rate = hitCount > 0 ? ((successCount / hitCount) * 100).toFixed(1) : '0.0';
    console.log(`\n\n📊 Stats: ${hitCount} hits | ${successCount} ok | ${errorCount} errors | ${rate}% success`);
}

async function runBurst(apiKey, total = 100) {
    console.log(`\n🚀 Sending ${total} burst hits for Starlight Retail...`);
    console.log(`   API Key: ${apiKey.substring(0, 18)}...`);
    console.log(`   Target: ${HIT_URL}\n`);

    for (let i = 0; i < total; i++) {
        await sendHit(apiKey);
        await new Promise(r => setTimeout(r, 80)); // ~12 hits/sec
    }

    await printStats();
    console.log('\n✅ Burst done! Open http://localhost:5173 to see the data.\n');
}

async function runContinuous(apiKey) {
    console.log(`\n🔄 Continuous mode — sending hits every ~2s for Starlight Retail...`);
    console.log(`   API Key: ${apiKey.substring(0, 18)}...`);
    console.log(`   Target: ${HIT_URL}`);
    console.log(`   Press Ctrl+C to stop.\n`);

    let round = 0;
    while (true) {
        round++;
        // Send 3-8 hits per round (simulating real traffic bursts)
        const batchSize = Math.floor(Math.random() * 6) + 3;
        for (let i = 0; i < batchSize; i++) {
            await sendHit(apiKey);
            await new Promise(r => setTimeout(r, 150));
        }

        // Print stats every 10 rounds
        if (round % 10 === 0) {
            await printStats();
        }

        // Wait 2-5 seconds before next batch
        const wait = Math.floor(Math.random() * 3000) + 2000;
        await new Promise(r => setTimeout(r, wait));
    }
}

async function main() {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('❌ No API key found!');
        console.error('   Run: node scripts/setup-starlight.js');
        console.error('   Or:  node scripts/starlight-hits.js apim_YOUR_KEY_HERE');
        process.exit(1);
    }

    if (isContinuous) {
        await runContinuous(apiKey);
    } else {
        const total = isBurst ? 150 : 60;
        await runBurst(apiKey, total);
    }
}

main().catch(console.error);
