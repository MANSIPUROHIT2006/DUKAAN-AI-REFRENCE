# DukaanAI — Frontend

This directory contains the entire frontend user interface for DukaanAI.

## Files
- `index.html`: The HTML markup for the voice assistant, ledger summary, customer list, and transaction history.
- `app.js`: Client-side logic for Web Speech API (voice capture), API communication, statement view, and PDF printing.
- `style.css`: Clean, responsive modern CSS.

## Hosting Options

### Option 1: Served directly by the Node.js Backend (Recommended for PieHost)
When running `backend/server.js`, it automatically serves this `frontend/` directory statically at `/`. No extra configuration needed.

### Option 2: Hosted independently (e.g., cPanel `public_html`, Netlify, Vercel, S3)
If you host this frontend on a separate domain or port from your backend:
1. In `frontend/index.html` (or before `app.js` is loaded), specify your backend URL:
   ```html
   <script>
     window.__API_BASE__ = 'https://api.yourdomain.com';
   </script>
   ```
2. The frontend will automatically route all requests to your backend API.
