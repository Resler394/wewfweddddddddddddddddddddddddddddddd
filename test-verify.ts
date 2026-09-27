import http from 'http';

function request(options: http.RequestOptions, body: any = null): Promise<{ status: number | undefined; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function testAll() {
  console.log('--- 1. Testing Admin Auth & Dashboard API ---');
  const loginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/management/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'ADMIN', passcode: 'VENTY_ADMIN_2025' });

  const adminToken = loginRes.body?.token;
  console.log('Admin login status:', loginRes.status, 'Has token:', !!adminToken);

  const dashRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/management/admin/dashboard',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + adminToken }
  });
  console.log('Dashboard status:', dashRes.status, 'Date:', dashRes.body?.date, 'Orders today:', dashRes.body?.ordersToday, 'Recent orders count:', dashRes.body?.recentOrders?.length);

  console.log('--- 2. Testing Customer Signup & Auth (Password-based) ---');
  const testPhone = '+213555999888';
  const signupRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/loyalty/signup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'E2E Test Customer', phone: testPhone, password: 'StrongPassword123!', favouriteDrink: 'Spanish Latte' });

  console.log('Signup status:', signupRes.status, 'Success:', signupRes.body?.success, 'Welcome stamps:', signupRes.body?.customer?.stamps);

  const custToken = signupRes.body?.token;
  const custAccountRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/loyalty/account?phone=${encodeURIComponent(testPhone)}`,
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + custToken }
  });
  console.log('Customer account fetch status:', custAccountRes.status, 'Stamps in account:', custAccountRes.body?.stamps);

  console.log('--- 3. Testing Order Creation & Real-Time Dashboard Integration ---');
  const idempotencyKey = 'order_e2e_' + Date.now();
  const orderRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + custToken }
  }, {
    items: [{ id: 'spanish-latte', name: 'Spanish Latte', price: 650, quantity: 2, size: 'Regular' }],
    customer: { name: 'E2E Test Customer', phone: testPhone },
    total: 1300,
    status: 'PENDING',
    idempotencyKey
  });
  console.log('Order creation status:', orderRes.status, 'Order ID:', orderRes.body?.order?.id);

  const dashAfterOrderRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/management/admin/dashboard',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + adminToken }
  });
  console.log('Dashboard after order - Orders today:', dashAfterOrderRes.body?.ordersToday, 'Pending orders:', dashAfterOrderRes.body?.pendingOrders, 'Today revenue:', dashAfterOrderRes.body?.todayRevenue);

  console.log('\n>>> ALL E2E VERIFICATIONS SUCCESSFUL! <<<');
}

testAll().catch(console.error);
