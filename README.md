# DukaanAI — Learning Reference & Hackathon Build Guide

This project is a reference for learning how a voice-led shop ledger can work. It is not a claim that this exact project has been tested against the hackathon environment.

## What it demonstrates
- FastAPI backend
- SQLite ledger
- Gemini API request for Hindi/Hinglish intent parsing
- Explicit confirmation before saving a transaction
- Customer balance and statement view
- Browser microphone speech-to-text where supported
- A demo mode to explore the UI without a Gemini API key

## Run it
Python 3.10+ recommended.

```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and set your Gemini API key. Do not share or commit `.env`.

```bash
uvicorn main:app --reload
```

Open http://127.0.0.1:8000

If you want to explore UI without an API key, click "Use local demo parser". This uses a basic rules parser, not Gemini. Do not describe demo mode as AI.

## Important setup note
Gemini model names and API availability can change. Set `GEMINI_MODEL` in `.env` to a model currently available to your Google AI Studio API key. If Gemini returns an error, check the current Gemini API docs and your API key/quota.

## Example commands
- Sharma ji ka 250 rupaye udhaar likho
- Sharma ji ne 100 rupaye de diye
- Verma ji ne 80 rupaye ka samaan liya
- Sharma ji ka hisaab dikhao
- Saare customers dikhao

## Before a real demo
- Test all examples with your own API key.
- Check that a payment reduces balance and a credit/sale increases it.
- Try unclear commands and verify nothing is saved until you confirm.
- Use demo data only; this app has no login, cloud backups, or production-grade accounting controls.
- Ask organizers what forms of pre-event practice/reference code are permitted. Make genuine event-time commits if required; don't disguise when code was written.

## Suggested hackathon build order
1. Build the core transaction form and SQLite schema.
2. Implement deterministic balance calculation and tests.
3. Add Gemini parsing on the backend.
4. Add confirmation and error handling.
5. Add voice input and statement printing.
6. Test end-to-end; document limitations.
7. Commit the code you genuinely write during the event.
8. Prepare a short demo and startup roadmap.
