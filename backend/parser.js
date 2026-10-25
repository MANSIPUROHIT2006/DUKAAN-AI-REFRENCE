function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

async function parseWithGemini(command, apiKey, model = 'gemini-3.5-flash-lite') {
  if (!apiKey) {
    const err = new Error('Gemini API key missing. Set GEMINI_API_KEY in .env.');
    err.status = 503;
    throw err;
  }

  const prompt = `
You parse Hindi/Hinglish shop-ledger commands. Return ONLY JSON:
{"intent":"add_transaction|show_statement|list_customers|unknown",
"customer":string|null,"kind":"credit|payment|sale"|null,"amount":number|null,
"note":string,"reply":string,"needs_clarification":boolean}
Rules: udhaar/credit adds outstanding (credit); payment received reduces outstanding (payment);
goods taken/sale adds outstanding (sale). A bill/hisaab request is show_statement.
A request to list all customers is list_customers. Never invent a missing customer or amount.
If uncertain, use unknown and needs_clarification=true. Do not claim anything has been saved.
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
  const payload = {
    systemInstruction: { parts: [{ text: prompt }] },
    contents: [{ role: 'user', parts: [{ text: command }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      maxOutputTokens: 350
    }
  };

  let response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (netErr) {
    const err = new Error(`Gemini connection failed: ${netErr.message}`);
    err.status = 502;
    throw err;
  }

  if (!response.ok) {
    let detail = 'Gemini API request failed';
    try {
      const errJson = await response.json();
      detail = errJson?.error?.message || detail;
    } catch (_) {}
    const err = new Error(detail);
    err.status = 502;
    throw err;
  }

  let jsonResult;
  try {
    jsonResult = await response.json();
  } catch (parseErr) {
    const err = new Error(`Gemini invalid response: ${parseErr.message}`);
    err.status = 502;
    throw err;
  }

  const candidates = jsonResult.candidates || [];
  if (!candidates.length) {
    const err = new Error('Gemini returned no result.');
    err.status = 502;
    throw err;
  }

  const rawText = (candidates[0]?.content?.parts || [])
    .map(p => p.text || '')
    .join('');

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (jsonErr) {
    const err = new Error(`Gemini JSON parse failed: ${jsonErr.message}`);
    err.status = 502;
    throw err;
  }

  if (!['add_transaction', 'show_statement', 'list_customers', 'unknown'].includes(data.intent)) {
    const err = new Error('Unexpected intent');
    err.status = 502;
    throw err;
  }

  if (![null, undefined, 'credit', 'payment', 'sale'].includes(data.kind)) {
    const err = new Error('Unexpected transaction kind');
    err.status = 502;
    throw err;
  }

  return data;
}

function localParse(command) {
  const s = (command || '').trim();
  const low = s.toLowerCase();

  // 1. List customers check
  if (['saare customer', 'all customers', 'customer list', 'सब ग्राहक', 'सारे ग्राहक'].some(k => low.includes(k))) {
    return {
      intent: 'list_customers',
      customer: null,
      kind: null,
      amount: null,
      note: s,
      reply: 'Demo mode: customer list.',
      needs_clarification: false
    };
  }

  // 2. Show statement check
  if (['hisaab dikhao', 'hisab dikhao', 'bill dikhao', 'statement', 'खाता दिखाओ', 'बिल दिखाओ'].some(k => low.includes(k))) {
    const parts = s.split(/ka hisaab|ka bill|का हिसाब|का बिल|hisaab dikhao|bill dikhao|दिखाओ/i);
    let name = parts[0] || '';
    name = name.replace(/\b(ji|का|की|के|ने)\b/gi, ' ').trim();
    if (name) {
      return {
        intent: 'show_statement',
        customer: toTitleCase(name),
        kind: null,
        amount: null,
        note: s,
        reply: 'Demo mode: statement lookup.',
        needs_clarification: false
      };
    }
    return {
      intent: 'unknown',
      customer: null,
      kind: null,
      amount: null,
      note: s,
      reply: 'Please say the customer name.',
      needs_clarification: true
    };
  }

  // 3. Amount parsing
  const amountMatch = s.match(/(\d+(?:\.\d+)?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

  // 4. Kind detection
  let kind = null;
  if (['de diye', 'de diya', 'payment', 'paid', 'जमा', 'दे दिए', 'दे दिया', 'पैसे दे'].some(k => low.includes(k))) {
    kind = 'payment';
  } else if (['samaan', 'सामान', 'khareeda', 'खरीदा', 'sale'].some(k => low.includes(k))) {
    kind = 'sale';
  } else if (['udhaar', 'उधार', 'credit', 'likh', 'लिख'].some(k => low.includes(k))) {
    kind = 'credit';
  }

  // 5. Customer name parsing
  const splitPattern = /\d|udhaar|उधार|credit|de diye|de diya|payment|paid|जमा|सामान|samaan|खरीदा|khareeda|लिख|likh/i;
  const nameParts = s.split(splitPattern);
  let name = nameParts[0] || '';
  name = name.replace(/\b(ji|का|की|के|ने|को)\b/gi, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();
  name = toTitleCase(name);

  if (kind && amount && name) {
    return {
      intent: 'add_transaction',
      customer: name,
      kind: kind,
      amount: amount,
      note: s,
      reply: 'Demo mode: check these fields before saving.',
      needs_clarification: false
    };
  }

  return {
    intent: 'unknown',
    customer: null,
    kind: null,
    amount: null,
    note: s,
    reply: 'Could not confidently parse. Try a clearer command.',
    needs_clarification: true
  };
}

module.exports = {
  parseWithGemini,
  localParse,
  toTitleCase
};
