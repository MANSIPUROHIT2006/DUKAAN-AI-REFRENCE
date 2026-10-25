# DukaanAI — Voice-Led Shop Ledger (Node.js & Express)

Voice-powered digital khata (shop ledger) built with Node.js, Express, SQLite, and Google Gemini AI. Fully compatible with PieHost (and other cPanel / Passenger Node.js hosts).

---

## Key Features
- **Node.js & Express Backend**: Lightweight, fast, and ready to host on PieHost or any cPanel hosting.
- **SQLite Ledger**: Persistent local database storing customer transactions and running balances.
- **Gemini AI Intent Parsing**: Understands natural Hindi and Hinglish voice/text commands.
- **Built-in Local Demo Parser**: Fallback rules-based parser for offline testing or without an API key.
- **Customer Statement & PDF Export**: Instant customer bill generation and print/save to PDF.
- **Voice Input**: Web Speech API integration for Hindi voice recording.

---

## Quick Start (Local)

### 1. Requirements
- Node.js 18+ (Node 20 LTS recommended)
- npm

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Copy `.env.example` to `.env` and configure your Google Gemini API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
PORT=8000
```

### 4. Run the Server
```bash
npm start
```
Then open `http://localhost:8000` in your web browser.

### 5. Run Automated Tests
```bash
npm test
```

---

## Hosting on PieHost (Step-by-Step)

See the detailed guide in [PIEHOST_DEPLOYMENT_GUIDE.md](file:///C:/Users/mansii/Desktop/DukaanAI_Learning_Reference/PIEHOST_DEPLOYMENT_GUIDE.md).

### Summary:
1. Log in to your **PieHost cPanel**.
2. Go to **Setup Node.js App** (under Software).
3. Click **Create Application**:
   - **Node.js version**: Choose `20.x` (or `18.x`).
   - **Application mode**: `Production`
   - **Application root**: e.g., `public_html` or subfolder.
   - **Application startup file**: `server.js` (or `app.js`).
4. Upload project files (or git clone):
   - `server.js`
   - `app.js`
   - `db.js`
   - `parser.js`
   - `package.json`
   - `.env`
   - `static/` (folder containing `index.html`, `app.js`, `style.css`)
5. In cPanel, click **Run NPM Install**.
6. Under **Environment variables**, ensure `GEMINI_API_KEY` and `GEMINI_MODEL` are set (or maintain them in `.env`).
7. Click **Restart** to launch your live site.

---

## Example Commands
- `Sharma ji ka 250 rupaye udhaar likho` (Adds ₹250 credit)
- `Sharma ji ne 100 rupaye de diye` (Deducts ₹100 payment)
- `Verma ji ne 80 rupaye ka samaan liya` (Adds ₹80 sale)
- `Sharma ji ka hisaab dikhao` (Shows statement for Sharma ji)
- `Saare customers dikhao` (Lists all customers and their balances)
