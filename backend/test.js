const http = require('http');

async function runTests() {
  const { app, server } = require('./server');
  const address = server.address();
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Testing server running at ${baseUrl}...`);

  async function req(path, method = 'GET', body = null) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : null
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  }

  try {
    // 1. Health check
    const h = await req('/api/health');
    console.log('1. Health check:', h.status, h.data);
    if (!h.ok || h.data.status !== 'ok') throw new Error('Health check failed');

    // 2. Clear demo data
    const clr = await req('/api/demo-data', 'DELETE');
    console.log('2. Clear data:', clr.status, clr.data);

    // 3. Add transactions
    const t1 = await req('/api/transactions', 'POST', {
      customer: 'Ramesh Kumar',
      kind: 'credit',
      amount: 500,
      note: '500 udhaar'
    });
    console.log('3. Add credit:', t1.status, t1.data);
    if (t1.data.balance !== 500) throw new Error('Balance expected 500');

    const t2 = await req('/api/transactions', 'POST', {
      customer: 'Ramesh Kumar',
      kind: 'payment',
      amount: 200,
      note: '200 jama'
    });
    console.log('4. Add payment:', t2.status, t2.data);
    if (t2.data.balance !== 300) throw new Error('Balance expected 300');

    // 4. Customers list
    const custs = await req('/api/customers');
    console.log('5. Customers:', custs.status, custs.data);
    if (custs.data.length !== 1 || custs.data[0].balance !== 300) throw new Error('Customers mismatch');

    // 5. Statement
    const stmt = await req('/api/customer/Ramesh%20Kumar/statement');
    console.log('6. Statement:', stmt.status, stmt.data);
    if (stmt.data.transactions.length !== 2) throw new Error('Statement tx count mismatch');

    // 6. Demo parser
    const dp = await req('/api/demo-interpret', 'POST', {
      command: 'Ramesh Kumar ka hisaab dikhao'
    });
    console.log('7. Demo interpret statement:', dp.status, dp.data.intent, dp.data.statement?.balance);
    if (dp.data.intent !== 'show_statement' || dp.data.statement?.balance !== 300) {
      throw new Error('Demo interpret statement failed');
    }

    // 7. Gemini interpret (if key present)
    if (h.data.gemini_configured) {
      const gp = await req('/api/interpret', 'POST', {
        command: 'Ramesh Kumar ne 100 rupaye de diye'
      });
      console.log('8. Gemini interpret:', gp.status, gp.data);
      if (gp.data.intent !== 'add_transaction' || gp.data.kind !== 'payment') {
        throw new Error('Gemini interpret unexpected result');
      }
    } else {
      console.log('8. Skipping Gemini interpret (no key configured).');
    }

    console.log('\n>>> ALL BACKEND TESTS PASSED SUCCESSFULLY! <<<\n');
  } catch (err) {
    console.error('\nXXX TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
