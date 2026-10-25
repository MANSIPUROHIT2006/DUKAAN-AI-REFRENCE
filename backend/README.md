# DukaanAI — Backend (Node.js & Express)

This directory contains the complete Node.js backend for DukaanAI, ready for PieHost deployment.

## Files
- `server.js`: The Express server, defining all REST API endpoints and serving the frontend.
- `app.js`: Phusion Passenger / cPanel startup entry point alias.
- `db.js`: SQLite database logic and queries.
- `parser.js`: Gemini AI API client and local rule-based demo parser.
- `test.js`: Automated test suite for all endpoints.
- `dukaanai.db`: Persistent SQLite database file.
- `package.json`: NPM dependencies (`express`, `sqlite3`, `dotenv`, `cors`).
- `.env`: API keys and configuration.

## Running Backend Independently

```bash
cd backend
npm install
npm test
npm start
```
The server will start on port 8000 (or `process.env.PORT`).
