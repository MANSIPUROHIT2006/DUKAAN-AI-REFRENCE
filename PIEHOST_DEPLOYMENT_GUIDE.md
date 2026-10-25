# PieHost Deployment Guide for DukaanAI

This guide details how to deploy your DukaanAI Node.js & Express application on **PieHost** (cPanel / CloudLinux Node.js hosting).

---

## 1. Files Needed on PieHost
Prepare a zip file or upload the following files to your PieHost application directory:

```text
├── server.js               (Main Express server)
├── app.js                  (Entry point alias for Passenger)
├── db.js                   (SQLite database layer)
├── parser.js               (Gemini AI & demo parser)
├── package.json            (Dependencies & start scripts)
├── dukaanai.db             (SQLite database file, or let it auto-create)
├── .env                    (Environment variables with your API key)
└── static/
    ├── index.html          (Main frontend)
    ├── app.js              (Frontend client logic)
    └── style.css           (Styling)
```

> [!NOTE]
> Do NOT upload `node_modules` or `.venv`. The host will install clean production modules for its Linux environment when you click **Run NPM Install**.

---

## 2. Setup Node.js Application in PieHost cPanel

1. **Log in to PieHost cPanel**:
   Navigate to your cPanel dashboard provided by PieHost.

2. **Open Setup Node.js App**:
   Under the **Software** section, click **Setup Node.js App**.

3. **Create Application**:
   Click the **Create Application** button and configure:
   - **Node.js version**: Select `20.x` (or `18.x`).
   - **Application mode**: `Production`.
   - **Application root**: Path where your files reside (e.g. `dukaanai` or `public_html`).
   - **Application URL**: Your domain or subdomain (e.g. `dukaan.yourdomain.com` or `yourdomain.com`).
   - **Application startup file**: Enter `server.js` (or `app.js`).

4. Click **Create** in the top right corner.

---

## 3. Upload Your Files
1. Open **cPanel File Manager**.
2. Go to the directory you selected in **Application root** (e.g., `dukaanai` or `public_html`).
3. Upload `server.js`, `app.js`, `db.js`, `parser.js`, `package.json`, `.env`, and the `static` folder.

---

## 4. Install Dependencies
1. Return to **Setup Node.js App** in cPanel.
2. Edit your created application.
3. In the **Detected configuration files** section, you will see `package.json`.
4. Click the **Run NPM Install** button.
   - Wait for it to complete. It will install `express`, `sqlite3`, `dotenv`, and `cors`.

---

## 5. Configure Environment Variables
You have two easy ways:

### Option A: Via cPanel UI (Recommended)
In the **Setup Node.js App** page, scroll down to **Environment variables**:
- **Name**: `GEMINI_API_KEY` | **Value**: `your_gemini_api_key`
- **Name**: `GEMINI_MODEL` | **Value**: `gemini-3.5-flash-lite` (or your chosen model)
Click **Add variable** and then **Save**.

### Option B: Via `.env` file
Ensure your `.env` file in the application directory contains:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
PORT=8000
```

---

## 6. Restart & Verify
1. Click **Restart Application** at the top of the Node.js application management page.
2. Click **Open** to visit your site in the browser.
3. Look at the top right status badge:
   - If it shows `● Gemini Active`, your Gemini API key is working.
   - If it shows `○ Demo Mode (No Key)`, check your `.env` or environment variables in cPanel.
4. Try speaking or clicking:
   - `Sharma ji ka 250 rupaye udhaar likho`
   - Click **Confirm & save**
   - Click **Bill** to view the statement.

---

## Troubleshooting on PieHost

- **503 Service Unavailable / Passenger Error**:
  Check `stderr.log` inside your application root. Ensure `server.js` exists and dependencies were installed with "Run NPM Install".
- **Port issue**:
  `server.js` automatically uses `process.env.PORT` which Phusion Passenger assigns dynamically. Do NOT hardcode a fixed port like 8000 when running under Passenger.
- **SQLite permissions**:
  Ensure the directory containing `dukaanai.db` has write permissions (`0755` or `0775`) so the web server process can create and update the database file.
