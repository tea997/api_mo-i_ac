/**
 * Starlight Retail Demo Setup
 * 
 * 1. Creates an API key for Starlight Retails client
 * 2. Starts the Demo server (blog-api → now renamed to starlight-retail-api)
 * 3. Sends a burst of realistic retail API hits
 * 
 * Run: node scripts/setup-starlight.js
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
    console.log('='.repeat(60));
    console.log('  Starlight Retail — API Key Setup');
    console.log('='.repeat(60));

    // 1. Login
    const login = await request('POST', '/auth/login', {
        username: 'superadmin',
        password: 'Admin@123',
    });
    if (!login.data.success) {
        console.error('❌ Login failed:', login.data.message);
        process.exit(1);
    }
    console.log('✅ Logged in as superadmin');

    // 2. Get Starlight Retails client ID
    const clients = await request('GET', '/admin/clients');
    const starlight = clients.data?.data?.clients?.find(c =>
        c.name.toLowerCase().includes('starlight')
    );
    if (!starlight) {
        console.error('❌ Starlight Retails client not found. Run test-flow.js first.');
        process.exit(1);
    }
    console.log(`✅ Found client: "${starlight.name}" [${starlight._id}]`);

    // 3. Check if API key already exists
    const existingKeys = await request('GET', `/admin/clients/${starlight._id}/api-keys`);
    const existingKey = existingKeys.data?.data?.apiKeys?.[0];
    let apiKey;

    if (existingKey && existingKey.isActive) {
        apiKey = existingKey.keyValue || existingKey.key;
        console.log(`✅ Using existing API key: ${apiKey}`);
    } else {
        // 4. Create API key for Starlight
        const createKey = await request('POST', `/admin/clients/${starlight._id}/api-keys`, {
            name: 'Starlight Production Key',
            description: 'Key for Starlight Retail store API',
            environment: 'production',
        });
        apiKey = createKey.data?.data?.keyValue;
        if (!apiKey) {
            console.error('❌ Failed to create API key:', JSON.stringify(createKey.data));
            process.exit(1);
        }
        console.log(`✅ Created API key: ${apiKey}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('  📋 COPY THESE VALUES:');
    console.log('='.repeat(60));
    console.log(`\nAPI_KEY=${apiKey}`);
    console.log(`\nPaste this into Demo/.env as:`);
    console.log(`  MONITORING_API_KEY=${apiKey}`);
    console.log('\n' + '='.repeat(60));
    console.log('  Next step: node scripts/starlight-hits.js');
    console.log('='.repeat(60));

    // Write the key to a temp file for use by other scripts
    const { writeFileSync } = await import('fs');
    writeFileSync('scripts/.starlight-key', apiKey);
    console.log('\n✅ Key saved to scripts/.starlight-key for use by starlight-hits.js');
}

main().catch(console.error);
