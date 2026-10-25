const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '.env') });

const {
  run,
  get,
  all,
  balanceFor,
  statementFor,
  listCustomers
} = require('./db');

const {
  parseWithGemini,
  localParse
} = require('./parser');

const app = express();
const PORT = process.env.PORT || 8000;
const API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const MODEL = (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, 'static')));

// Helper for formatted ISO timestamp (matches Python's isoformat(timespec="seconds"))
function getTimestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    gemini_configured: Boolean(API_KEY),
    model: MODEL
  });
});

// Interpret with Gemini
app.post('/api/interpret', async (req, res) => {
  try {
    const command = (req.body?.command || '').trim();
    if (!command || command.length < 2) {
      return res.status(400).json({ detail: 'Command must be at least 2 characters long.' });
    }

    const data = await parseWithGemini(command, API_KEY, MODEL);
    data.original_command = command;

    if (data.intent === 'show_statement' && data.customer) {
      data.statement = await statementFor(data.customer);
    }
    if (data.intent === 'list_customers') {
      data.customers = await listCustomers();
    }

    res.json(data);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ detail: err.message || 'Gemini interpret failed' });
  }
});

// Demo / rule-based interpretation
app.post('/api/demo-interpret', async (req, res) => {
  try {
    const command = (req.body?.command || '').trim();
    if (!command || command.length < 2) {
      return res.status(400).json({ detail: 'Command must be at least 2 characters long.' });
    }

    const data = localParse(command);
    data.original_command = command;

    if (data.intent === 'show_statement' && data.customer) {
      data.statement = await statementFor(data.customer);
    }
    if (data.intent === 'list_customers') {
      data.customers = await listCustomers();
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ detail: err.message || 'Demo interpret failed' });
  }
});

// Add transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { customer, kind, amount, note } = req.body || {};
    const cust = (customer || '').trim();
    const amt = parseFloat(amount);
    const noteText = (note || '').trim();

    if (!cust) {
      return res.status(400).json({ detail: 'Customer name is required.' });
    }
    if (!['credit', 'payment', 'sale'].includes(kind)) {
      return res.status(400).json({ detail: 'Invalid transaction kind.' });
    }
    if (isNaN(amt) || amt <= 0 || amt > 100000000) {
      return res.status(400).json({ detail: 'Amount must be greater than 0.' });
    }

    const createdAt = getTimestamp();
    const result = await run(
      'INSERT INTO transactions(customer, kind, amount, note, created_at) VALUES(?, ?, ?, ?, ?)',
      [cust, kind, Math.round(amt * 100) / 100, noteText, createdAt]
    );

    const row = await get('SELECT * FROM transactions WHERE id = ?', [result.lastID]);
    const balance = await balanceFor(cust);

    res.json({
      transaction: row,
      balance
    });
  } catch (err) {
    res.status(500).json({ detail: 'Failed to record transaction: ' + err.message });
  }
});

// List customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await listCustomers();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// List recent transactions
app.get('/api/transactions', async (req, res) => {
  try {
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit)) limit = 50;
    limit = Math.max(1, Math.min(limit, 200));

    const rows = await all(
      'SELECT * FROM transactions ORDER BY id DESC LIMIT ?',
      [limit]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// Get customer statement
app.get('/api/customer/:customer/statement', async (req, res) => {
  try {
    const customer = req.params.customer;
    const result = await statementFor(customer);
    if (!result.transactions || result.transactions.length === 0) {
      return res.status(404).json({ detail: 'No transactions found.' });
    }
    result.generated_at = getTimestamp();
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// Clear demo data
app.delete('/api/demo-data', async (req, res) => {
  try {
    await run('DELETE FROM transactions');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// 404 fallback for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ detail: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    detail: err.message || 'Internal server error',
    error: err.message || 'Internal server error'
  });
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`DukaanAI server running on port ${PORT}`);
});

module.exports = { app, server };
