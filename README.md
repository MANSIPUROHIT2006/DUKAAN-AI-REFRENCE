# DukaanAI — Voice-Led Shop Ledger (Node.js & Express)

Voice-powered digital khata (shop ledger) built with Node.js, Express, SQLite, and Google Gemini AI. Fully organized into separate `frontend/` and `backend/` directories, compatible with PieHost (and other cPanel / Passenger Node.js hosts).

---

## Directory Structure
```text
DukaanAI_Learning_Reference/
├── frontend/                   # Client-side files
│   ├── index.html              # HTML user interface
│   ├── app.js                  # Speech-to-text, UI logic, PDF statement generator
│   ├── style.css               # Clean responsive styling
│   └── README.md
├── backend/                    # Node.js + Express API server
│   ├── server.js               # Express application with REST endpoints
│   ├── app.js                  # Passenger entry-point alias
│   ├── db.js                   # SQLite database & transaction logic
│   ├── parser.js               # Gemini AI & rule-based parser
│   ├── dukaanai.db             # Persistent SQLite database
│   ├── test.js                 # Automated API & parser test suite
│   ├── package.json            # Backend dependencies
│   ├── .env                    # Gemini API credentials
│   └── README.md
├── PIEHOST_DEPLOYMENT_GUIDE.md # Complete PieHost deployment instructions
└── package.json                # Root scripts to run both seamlessly
```

---

## Quick Start (Local)

### 1. Requirements
- Node.js 18+ (Node 20 LTS recommended)
- npm

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start the Application
```bash
npm start
```
Open **`http://localhost:8000`** in your browser.

---

## Deployment on PieHost
Follow the detailed instructions in [PIEHOST_DEPLOYMENT_GUIDE.md](file:///C:/Users/mansii/Desktop/DukaanAI_Learning_Reference/PIEHOST_DEPLOYMENT_GUIDE.md). Both unified deployment and separate frontend/backend deployments are supported.
