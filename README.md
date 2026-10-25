# DukaanAI — Voice-Led Shop Ledger (Node.js & Express)

Voice-powered digital khata (shop ledger) built with Node.js, Express, SQLite, and Google Gemini AI. Fully organized into separate `frontend/` and `backend/` directories with full MERN-style developer workflows, compatible with PieHost (and other cPanel / Passenger Node.js hosts).

---

## Directory Structure
```text
DukaanAI_Learning_Reference/
├── frontend/                   # Frontend Client
│   ├── index.html              # HTML user interface
│   ├── app.js                  # Speech-to-text, UI logic, PDF statement generator
│   ├── style.css               # Clean responsive styling
│   ├── dev-server.js           # Frontend development server (port 3000)
│   ├── package.json            # Frontend scripts
│   └── README.md
├── backend/                    # Node.js + Express API Server
│   ├── server.js               # Express application with REST endpoints (port 8000)
│   ├── app.js                  # Passenger entry-point alias
│   ├── db.js                   # SQLite database & transaction logic
│   ├── parser.js               # Gemini AI & rule-based parser
│   ├── dukaanai.db             # Persistent SQLite database
│   ├── test.js                 # Automated API & parser test suite
│   ├── package.json            # Backend dependencies
│   ├── .env                    # Gemini API credentials
│   └── README.md
├── start.bat                   # One-click Windows runner
├── PIEHOST_DEPLOYMENT_GUIDE.md # Complete PieHost deployment instructions
└── package.json                # Root MERN concurrently scripts
```

---

## Development (MERN-Style Workflow)

### 1. Run Both Frontend & Backend Concurrently (Root)
From the root directory:
```bash
npm run dev
```
- **Backend API**: `http://localhost:8000`
- **Frontend App**: `http://localhost:3000` (automatically communicates with backend at `http://localhost:8000`)

### 2. Run Individually
- **Frontend only**:
  ```bash
  cd frontend
  npm run dev
  ```
- **Backend only**:
  ```bash
  cd backend
  npm run dev
  ```

### 3. Production / PieHost Run
```bash
npm start
```
Starts `backend/server.js`, serving the complete application and static frontend at `http://localhost:8000` (or `process.env.PORT`).

---

## Deployment on PieHost
Follow the detailed instructions in [PIEHOST_DEPLOYMENT_GUIDE.md](file:///C:/Users/mansii/Desktop/DukaanAI_Learning_Reference/PIEHOST_DEPLOYMENT_GUIDE.md). Both unified deployment and separate frontend/backend deployments are supported.
