# PieHost Deployment Guide for DukaanAI

DukaanAI is organized into two clean, self-contained directories:
- `frontend/`: The client application (HTML, CSS, JavaScript).
- `backend/`: The Node.js Express server, SQLite database, and Gemini AI parsing logic.

---

## Project Structure Overview

```text
DukaanAI_Learning_Reference/
├── frontend/
│   ├── index.html              # Web interface
│   ├── app.js                  # Frontend client logic & speech recognition
│   ├── style.css               # Styling
│   └── README.md
├── backend/
│   ├── server.js               # Main Express application
│   ├── app.js                  # Passenger entry-point alias
│   ├── db.js                   # SQLite database manager
│   ├── parser.js               # Gemini AI & demo parser
│   ├── dukaanai.db             # Database file
│   ├── package.json            # Dependencies (express, sqlite3, dotenv, cors)
│   ├── test.js                 # Automated test suite
│   ├── .env                    # Environment variables
│   └── README.md
├── PIEHOST_DEPLOYMENT_GUIDE.md
└── README.md
```

---

## Deployment Option 1: Unified Deployment (Simplest & Recommended)

In this setup, the Express backend automatically serves the `frontend/` folder, so you only need to run a single Node.js application in PieHost.

### Step 1: Open PieHost cPanel
Log in to your PieHost cPanel account.

### Step 2: Create Node.js Application
1. In cPanel, find and click **Setup Node.js App** (under Software).
2. Click **Create Application**:
   - **Node.js version**: `20.x` (or `18.x`).
   - **Application mode**: `Production`.
   - **Application root**: `dukaanai` (or `public_html`).
   - **Application URL**: Your domain (e.g., `yourdomain.com`).
   - **Application startup file**: `backend/server.js` (or `server.js`).
3. Click **Create**.

### Step 3: Upload Project Files
Using **cPanel File Manager** or FTP, upload:
- The entire `backend/` folder
- The entire `frontend/` folder
- `package.json`
- `.env`

*(Do NOT upload `node_modules` or `.venv`)*

### Step 4: Install Dependencies
1. In **Setup Node.js App**, open your application.
2. In the **Detected configuration files** section, click **Run NPM Install**.
   - This installs `express`, `sqlite3`, `dotenv`, and `cors`.

### Step 5: Configure Environment Variables
Under **Environment variables** in the cPanel Node.js App UI (or in your `.env` file):
- `GEMINI_API_KEY`: Your Google Gemini API key
- `GEMINI_MODEL`: `gemini-3.5-flash-lite`

### Step 6: Restart & Test
1. Click **Restart Application** in cPanel.
2. Visit your domain in your browser.
3. You will see the DukaanAI interface with a green `● Gemini Active` badge!

---

## Deployment Option 2: Separate Frontend & Backend

If you prefer hosting the frontend as static files in `public_html` and the backend under a subdomain (e.g. `api.yourdomain.com`) or subpath:

1. **Deploy Backend**:
   - Set **Application root** in cPanel to `backend`.
   - Set **Application startup file** to `server.js`.
   - Click **Run NPM Install** and set your `GEMINI_API_KEY`.
2. **Deploy Frontend**:
   - Upload the contents of `frontend/` (`index.html`, `app.js`, `style.css`) to `public_html`.
   - In `frontend/index.html` (or top of `frontend/app.js`), specify your backend URL:
     ```html
     <script>
       window.__API_BASE__ = 'https://api.yourdomain.com';
     </script>
     ```
   - All frontend requests will automatically target your backend API.

---

## Testing Locally Before Deploying

```bash
# From the root directory:
npm test       # Runs all automated API tests
npm start      # Starts server at http://localhost:8000

# Or from the backend directory:
cd backend
npm test
npm start
```
