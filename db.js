const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'dukaanai.db');
const db = new sqlite3.Database(DB_PATH);

// Initialize database schema
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN ('credit','payment','sale')),
    amount REAL NOT NULL CHECK(amount > 0),
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`);
});

// Promise wrappers
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// Business logic
async function balanceFor(customer) {
  const rows = await all(
    'SELECT kind, amount FROM transactions WHERE lower(customer) = lower(?)',
    [customer]
  );
  const total = rows.reduce((sum, r) => {
    const amt = parseFloat(r.amount) || 0;
    return r.kind === 'credit' || r.kind === 'sale' ? sum + amt : sum - amt;
  }, 0);
  return Math.round(total * 100) / 100;
}

async function statementFor(customer) {
  const rows = await all(
    'SELECT * FROM transactions WHERE lower(customer) = lower(?) ORDER BY id',
    [customer]
  );
  const balance = await balanceFor(customer);
  return {
    customer,
    transactions: rows,
    balance
  };
}

async function listCustomers() {
  const rows = await all(
    'SELECT customer FROM transactions GROUP BY lower(customer), customer ORDER BY customer'
  );
  const out = [];
  for (const row of rows) {
    const n = row.customer;
    const countRow = await get(
      'SELECT COUNT(*) as count FROM transactions WHERE lower(customer) = lower(?)',
      [n]
    );
    const balance = await balanceFor(n);
    out.push({
      customer: n,
      balance,
      transactions: countRow ? countRow.count : 0
    });
  }
  return out;
}

module.exports = {
  db,
  run,
  get,
  all,
  balanceFor,
  statementFor,
  listCustomers
};
