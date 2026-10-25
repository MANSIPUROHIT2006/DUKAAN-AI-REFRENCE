// DukaanAI Frontend Client Logic
// If frontend is hosted separately from backend, configure window.__API_BASE__ = 'https://your-backend.com'
const API_BASE = window.__API_BASE__ || '';

const $ = id => document.getElementById(id);
let last = null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

const money = n => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
}).format(Number(n) || 0);

const label = k => ({
  credit: 'Udhaar added',
  payment: 'Payment received',
  sale: 'Goods / sale'
}[k] || k);

function msg(t, isError = false) {
  const m = $('message');
  m.textContent = t;
  m.style.color = isError ? '#c92a2a' : 'var(--green)';
}

async function apiInterpret(endpoint) {
  const command = $('command').value.trim();
  if (!command) {
    msg('Type or speak a command first.', true);
    return;
  }
  msg('Working…');
  try {
    const r = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    const d = await r.json();
    if (!r.ok) {
      throw new Error(d.detail || d.error || 'Request failed');
    }
    last = d;
    render(d);
    msg('Review the result. No entry is saved until you confirm.');
  } catch (e) {
    msg(e.message, true);
  }
}

$('ask').onclick = () => apiInterpret('/api/interpret');
$('demo').onclick = () => apiInterpret('/api/demo-interpret');

// Allow Enter key to trigger parse
$('command').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const isGeminiReady = $('status').dataset.configured === 'true';
    apiInterpret(isGeminiReady ? '/api/interpret' : '/api/demo-interpret');
  }
});

// Clickable examples
document.querySelectorAll('.examples button').forEach(b => {
  b.onclick = () => {
    $('command').value = b.textContent;
    $('command').focus();
  };
});

// Speech Recognition with visual feedback
$('mic').onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    msg('Browser voice recognition not available. Type the command instead.', true);
    return;
  }
  const micBtn = $('mic');
  const originalText = micBtn.textContent;
  micBtn.textContent = '🔴 Listening…';
  micBtn.disabled = true;

  const r = new SR();
  r.lang = 'hi-IN';

  r.onresult = e => {
    micBtn.textContent = originalText;
    micBtn.disabled = false;
    $('command').value = e.results[0][0].transcript;
    msg('Voice captured. Review or choose Ask Gemini / Demo parser.');
  };

  r.onerror = e => {
    micBtn.textContent = originalText;
    micBtn.disabled = false;
    msg('Microphone error: ' + e.error, true);
  };

  r.onend = () => {
    micBtn.textContent = originalText;
    micBtn.disabled = false;
  };

  r.start();
};

function render(d) {
  const box = $('result');
  box.classList.remove('hidden');

  if (d.intent === 'add_transaction' && !d.needs_clarification && d.customer && d.amount != null && ['credit', 'payment', 'sale'].includes(d.kind)) {
    box.innerHTML = `
      <h3>Review before saving</h3>
      <p>${esc(d.reply || 'Check the details.')}</p>
      <div class="grid">
        <div>
          <label>Customer</label>
          <input id="rName" value="${esc(d.customer)}">
        </div>
        <div>
          <label>Type</label>
          <select id="rKind">
            <option value="credit" ${d.kind === 'credit' ? 'selected' : ''}>Udhaar (Credit)</option>
            <option value="payment" ${d.kind === 'payment' ? 'selected' : ''}>Payment received</option>
            <option value="sale" ${d.kind === 'sale' ? 'selected' : ''}>Sale / goods</option>
          </select>
        </div>
        <div>
          <label>Amount ₹</label>
          <input id="rAmount" type="number" min=".01" step=".01" value="${Number(d.amount)}">
        </div>
      </div>
      <p class="hint">Original: ${esc(d.original_command)}</p>
      <div class="result-actions">
        <button class="primary" id="save">Confirm & save</button>
        <button class="secondary" id="cancel">Cancel</button>
      </div>
    `;
    $('save').onclick = save;
    $('cancel').onclick = () => {
      box.classList.add('hidden');
      msg('Cancelled; nothing saved.');
    };
  } else if (d.intent === 'show_statement' && d.statement) {
    const s = d.statement;
    const txHtml = (s.transactions || []).map(t => `
      <div class="row">
        <div class="meta">
          <b>${esc(label(t.kind))}</b>
          <small>${esc(t.created_at)} ${t.note ? '• ' + esc(t.note) : ''}</small>
        </div>
        <span class="amt">${money(t.amount)}</span>
      </div>
    `).join('') || '<p>No transactions yet.</p>';

    box.innerHTML = `
      <h3>Statement: ${esc(s.customer)}</h3>
      ${txHtml}
      <h3 style="margin-top:14px">Balance: ${money(s.balance)}</h3>
      <div class="result-actions">
        <button id="print" class="primary">Print / Export PDF</button>
        <button id="closeStmt" class="secondary">Close</button>
      </div>
    `;
    $('print').onclick = () => printStmt(s);
    $('closeStmt').onclick = () => box.classList.add('hidden');
  } else if (d.intent === 'list_customers') {
    const custs = d.customers || [];
    const custHtml = custs.map(c => `
      <div class="row">
        <div class="meta">
          <b>${esc(c.customer)}</b>
          <small>${c.transactions} transaction(s)</small>
        </div>
        <span class="amt">${money(c.balance)}</span>
      </div>
    `).join('') || '<p>No customers found.</p>';

    box.innerHTML = `
      <h3>Customer list</h3>
      ${custHtml}
      <div class="result-actions">
        <button id="closeCust" class="secondary">Close</button>
      </div>
    `;
    $('closeCust').onclick = () => box.classList.add('hidden');
  } else {
    box.innerHTML = `
      <h3>Need clarification</h3>
      <p>${esc(d.reply || 'Please use a clearer command.')}</p>
      <p class="hint">Nothing has been saved.</p>
      <div class="result-actions">
        <button id="closeClarify" class="secondary">Close</button>
      </div>
    `;
    $('closeClarify').onclick = () => box.classList.add('hidden');
  }
}

async function save() {
  const customer = $('rName').value.trim();
  const kind = $('rKind').value;
  const amount = Number($('rAmount').value);

  if (!customer || isNaN(amount) || amount <= 0) {
    return msg('Please provide a valid customer name and positive amount.', true);
  }

  msg('Saving transaction…');
  try {
    const r = await fetch(`${API_BASE}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer,
        kind,
        amount,
        note: last?.original_command || ''
      })
    });
    const d = await r.json();
    if (!r.ok) {
      return msg(d.detail || d.error || 'Save failed', true);
    }
    $('result').classList.add('hidden');
    $('command').value = '';
    msg(`Saved! Updated balance for ${customer}: ${money(d.balance)}`);
    refresh();
  } catch (e) {
    msg(e.message, true);
  }
}

function printStmt(s) {
  const w = window.open('', '_blank');
  if (!w) return msg('Allow popups to print statement.', true);

  const txRows = (s.transactions || []).map(t =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #ddd">${esc(t.created_at)}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd">${esc(label(t.kind))}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd">${esc(t.note || '-')}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right"><b>${money(t.amount)}</b></td>
    </tr>`
  ).join('');

  w.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Statement - ${esc(s.customer)}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #17241e; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { text-align: left; padding: 8px; background: #f4f7f1; border-bottom: 2px solid #ddd; }
        .total { font-size: 18px; margin-top: 16px; }
        button { background: #1d6047; color: white; border: 0; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-size: 14px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <h2>DukaanAI — Customer Statement</h2>
      <h3>Customer: ${esc(s.customer)}</h3>
      <table>
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Type</th>
            <th>Note</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${txRows || '<tr><td colspan="4" style="padding:8px;text-align:center">No transactions recorded</td></tr>'}
        </tbody>
      </table>
      <div class="total"><b>Current Outstanding Balance:</b> ${money(s.balance)}</div>
      <p style="color:#718077;font-size:12px;margin-top:20px">Generated on ${esc(new Date().toLocaleString('en-IN'))}</p>
      <button onclick="window.print()">Print / Save PDF</button>
    </body>
    </html>
  `);
  w.document.close();
}

async function loadStatementDirectly(customerName) {
  $('command').value = `${customerName} ka hisaab dikhao`;
  msg(`Loading statement for ${customerName}…`);
  try {
    const r = await fetch(`${API_BASE}/api/customer/${encodeURIComponent(customerName)}/statement`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Could not load statement');
    render({
      intent: 'show_statement',
      customer: customerName,
      statement: d
    });
    msg(`Showing statement for ${customerName}`);
  } catch (e) {
    msg(e.message, true);
  }
}

async function refresh() {
  try {
    const [csRes, txRes, allRes] = await Promise.all([
      fetch(`${API_BASE}/api/customers`),
      fetch(`${API_BASE}/api/transactions?limit=12`),
      fetch(`${API_BASE}/api/transactions?limit=200`)
    ]);

    const cs = await csRes.json();
    const tx = await txRes.json();
    const all = await allRes.json();

    $('cc').textContent = cs.length;
    $('bal').textContent = money(cs.reduce((a, c) => a + (c.balance || 0), 0));
    $('tc').textContent = all.length;

    $('customers').innerHTML = cs.map(c => `
      <div class="row">
        <div class="avatar">${esc((c.customer || '?')[0].toUpperCase())}</div>
        <div class="meta">
          <b>${esc(c.customer)}</b>
          <small>${c.transactions} transaction(s)</small>
        </div>
        <span class="amt">${money(c.balance)}</span>
        <button class="view" data-name="${esc(c.customer)}">Bill</button>
      </div>
    `).join('') || '<p style="color:var(--muted);padding:10px 0">No customers yet.</p>';

    $('transactions').innerHTML = tx.map(t => `
      <div class="row">
        <div class="meta">
          <b>${esc(t.customer)} · ${esc(label(t.kind))}</b>
          <small>${esc(t.created_at)}</small>
        </div>
        <span class="amt">${money(t.amount)}</span>
      </div>
    `).join('') || '<p style="color:var(--muted);padding:10px 0">No transactions yet.</p>';

    document.querySelectorAll('.view').forEach(b => {
      b.onclick = () => loadStatementDirectly(b.dataset.name);
    });
  } catch (e) {
    msg('Backend not available. Start the Node.js server.', true);
  }
}

$('refresh').onclick = refresh;

$('clear').onclick = async () => {
  if (confirm('Delete all demo transactions? This cannot be undone.')) {
    try {
      await fetch(`${API_BASE}/api/demo-data`, { method: 'DELETE' });
      await refresh();
      $('result').classList.add('hidden');
      msg('All demo data cleared.');
    } catch (e) {
      msg(e.message, true);
    }
  }
};

// Check backend health on load
fetch(`${API_BASE}/api/health`)
  .then(r => r.json())
  .then(h => {
    const statusElem = $('status');
    if (h.gemini_configured) {
      statusElem.textContent = '● Gemini Active';
      statusElem.dataset.configured = 'true';
      statusElem.style.background = '#e5f4e8';
      statusElem.style.color = 'var(--green)';
    } else {
      statusElem.textContent = '○ Demo Mode (No Key)';
      statusElem.dataset.configured = 'false';
      statusElem.style.background = '#fff3cd';
      statusElem.style.color = '#856404';
    }
  })
  .catch(() => {
    const statusElem = $('status');
    statusElem.textContent = '✕ Server Offline';
    statusElem.style.background = '#f8d7da';
    statusElem.style.color = '#721c24';
  });

refresh();
