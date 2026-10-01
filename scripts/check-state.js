/**
 * Quick check of current system state - clients and API keys
 */
const BASE_URL = 'http://localhost:5000/api';
let authCookie = '';

async function request(method, path, body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(authCookie ? { Cookie: authCookie } : {}),
        },
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${BASE_URL}${path}`, options);
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) authCookie = setCookie.split(';')[0];
    return { status: res.status, data: await res.json() };
}

async function main() {
    console.log('🔍 Checking system state...\n');

    const login = await request('POST', '/auth/login', {
        username: 'superadmin',
        password: 'Admin@123',
    });
    console.log('Login:', login.data.success ? '✅ OK' : '❌ FAILED', login.data.message || '');
    if (!login.data.success) return;

    const clients = await request('GET', '/admin/clients');
    const clientList = clients.data?.data?.clients || [];
    console.log(`\nClients (${clientList.length} total):`);
    clientList.forEach(c => {
        console.log(`  - [${c._id}] ${c.name} (${c.email})`);
    });

    // For each client, list API keys
    for (const client of clientList) {
        const keys = await request('GET', `/admin/clients/${client._id}/api-keys`);
        const keyList = keys.data?.data?.apiKeys || [];
        console.log(`\n  API Keys for "${client.name}" (${keyList.length} total):`);
        keyList.forEach(k => {
            console.log(`    - [${k._id}] ${k.name} | Key: ${k.keyValue || k.key || 'hidden'} | Active: ${k.isActive}`);
        });
    }

    // Check analytics
    const analytics = await request('GET', '/analytics/dashboard');
    console.log('\nDashboard Analytics:', JSON.stringify(analytics.data?.data, null, 2));
}

main().catch(console.error);
