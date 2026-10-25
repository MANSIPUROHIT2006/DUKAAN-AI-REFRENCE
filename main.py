import os, json, sqlite3, datetime
from pathlib import Path
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")
DB = ROOT / "dukaanai.db"
API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()

app = FastAPI(title="DukaanAI Learning Reference")
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")

def conn_db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute("""CREATE TABLE IF NOT EXISTS transactions(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer TEXT NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('credit','payment','sale')),
        amount REAL NOT NULL CHECK(amount > 0),
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
    )""")
    con.commit()
    return con

@app.on_event("startup")
def startup():
    c = conn_db()
    c.close()

class Command(BaseModel):
    command: str = Field(min_length=2, max_length=1000)

class Tx(BaseModel):
    customer: str = Field(min_length=1, max_length=100)
    kind: str
    amount: float = Field(gt=0, le=100000000)
    note: str = Field(default="", max_length=1000)

def balance_for(con, customer):
    rows = con.execute("SELECT kind,amount FROM transactions WHERE lower(customer)=lower(?)", (customer,)).fetchall()
    total = sum(float(r["amount"]) if r["kind"] in ("credit","sale") else -float(r["amount"]) for r in rows)
    return round(total, 2)

def statement_for(con, customer):
    rows = con.execute("SELECT * FROM transactions WHERE lower(customer)=lower(?) ORDER BY id", (customer,)).fetchall()
    return {"customer": customer, "transactions": [dict(r) for r in rows], "balance": balance_for(con, customer)}

def list_customers():
    con = conn_db()
    rows = con.execute("SELECT customer FROM transactions GROUP BY lower(customer),customer ORDER BY customer").fetchall()
    out = []
    for row in rows:
        n = row["customer"]
        count = con.execute("SELECT COUNT(*) FROM transactions WHERE lower(customer)=lower(?)", (n,)).fetchone()[0]
        out.append({"customer": n, "balance": balance_for(con,n), "transactions": count})
    con.close()
    return out

async def parse_with_gemini(command):
    if not API_KEY:
        raise HTTPException(503, "Gemini API key missing. Set GEMINI_API_KEY in .env.")
    prompt = """
You parse Hindi/Hinglish shop-ledger commands. Return ONLY JSON:
{"intent":"add_transaction|show_statement|list_customers|unknown",
"customer":string|null,"kind":"credit|payment|sale"|null,"amount":number|null,
"note":string,"reply":string,"needs_clarification":boolean}
Rules: udhaar/credit adds outstanding (credit); payment received reduces outstanding (payment);
goods taken/sale adds outstanding (sale). A bill/hisaab request is show_statement.
A request to list all customers is list_customers. Never invent a missing customer or amount.
If uncertain, use unknown and needs_clarification=true. Do not claim anything has been saved.
"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    payload = {
        "systemInstruction":{"parts":[{"text":prompt}]},
        "contents":[{"role":"user","parts":[{"text":command}]}],
        "generationConfig":{"responseMimeType":"application/json","temperature":0.1,"maxOutputTokens":350}
    }
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            r = await client.post(url, params={"key":API_KEY}, json=payload)
        if r.status_code >= 400:
            try: detail = r.json().get("error",{}).get("message","Gemini API request failed")
            except Exception: detail = "Gemini API request failed"
            raise HTTPException(502, detail)
        candidates = r.json().get("candidates",[])
        if not candidates: raise HTTPException(502,"Gemini returned no result.")
        raw = "".join(p.get("text","") for p in candidates[0].get("content",{}).get("parts",[]))
        data = json.loads(raw)
        if data.get("intent") not in {"add_transaction","show_statement","list_customers","unknown"}:
            raise ValueError("Unexpected intent")
        if data.get("kind") not in {None,"credit","payment","sale"}:
            raise ValueError("Unexpected transaction kind")
        return data
    except HTTPException: raise
    except (httpx.HTTPError, json.JSONDecodeError, ValueError, KeyError) as e:
        raise HTTPException(502, f"Gemini parse failed: {e}")

def local_parse(command):
    """Fallback for UI practice only. This is rules-based, not AI."""
    import re
    s = command.strip()
    low = s.lower()
    if any(k in low for k in ["saare customer","all customers","customer list","सब ग्राहक","सारे ग्राहक"]):
        return {"intent":"list_customers","customer":None,"kind":None,"amount":None,"note":s,"reply":"Demo mode: customer list.","needs_clarification":False}
    if any(k in low for k in ["hisaab dikhao","hisab dikhao","bill dikhao","statement","खाता दिखाओ","बिल दिखाओ"]):
        name = re.split(r"ka hisaab|ka bill|का हिसाब|का बिल|hisaab dikhao|bill dikhao|दिखाओ", s, flags=re.I)[0]
        name = re.sub(r"(?i)\b(ji|का|की|के|ने)\b"," ",name).strip()
        if name:
            return {"intent":"show_statement","customer":name.title(),"kind":None,"amount":None,"note":s,"reply":"Demo mode: statement lookup.","needs_clarification":False}
        return {"intent":"unknown","customer":None,"kind":None,"amount":None,"note":s,"reply":"Please say the customer name.","needs_clarification":True}
    amount_match = re.search(r"(\d+(?:\.\d+)?)", s)
    amount = float(amount_match.group(1)) if amount_match else None
    if any(k in low for k in ["de diye","de diya","payment","paid","जमा","दे दिए","दे दिया","पैसे दे"]):
        kind="payment"
    elif any(k in low for k in ["samaan","सामान","khareeda","खरीदा","sale"]):
        kind="sale"
    elif any(k in low for k in ["udhaar","उधार","credit","likh","लिख"]):
        kind="credit"
    else:
        kind=None
    name = re.split(r"\d|udhaar|उधार|credit|de diye|de diya|payment|paid|जमा|सामान|samaan|खरीदा|khareeda|लिख|likh",s,flags=re.I)[0]
    name = re.sub(r"(?i)\b(ji|का|की|के|ने|को)\b"," ",name).strip(" ,.-").title()
    if kind and amount and name:
        return {"intent":"add_transaction","customer":name,"kind":kind,"amount":amount,"note":s,"reply":"Demo mode: check these fields before saving.","needs_clarification":False}
    return {"intent":"unknown","customer":None,"kind":None,"amount":None,"note":s,"reply":"Could not confidently parse. Try a clearer command.","needs_clarification":True}

@app.get("/")
def home():
    return FileResponse(ROOT / "static" / "index.html")

@app.get("/api/health")
def health():
    return {"status":"ok","gemini_configured":bool(API_KEY),"model":MODEL}

@app.post("/api/interpret")
async def interpret(body: Command):
    # Gemini is the default. Rules parser is available only when explicitly requested by UI.
    data = await parse_with_gemini(body.command)
    data["original_command"] = body.command
    if data.get("intent") == "show_statement" and data.get("customer"):
        con=conn_db(); data["statement"]=statement_for(con,data["customer"]); con.close()
    if data.get("intent") == "list_customers":
        data["customers"]=list_customers()
    return data

@app.post("/api/demo-interpret")
def demo_interpret(body: Command):
    data = local_parse(body.command)
    data["original_command"] = body.command
    if data.get("intent") == "show_statement" and data.get("customer"):
        con=conn_db(); data["statement"]=statement_for(con,data["customer"]); con.close()
    if data.get("intent") == "list_customers":
        data["customers"]=list_customers()
    return data

@app.post("/api/transactions")
def add_tx(body: Tx):
    customer=body.customer.strip()
    if body.kind not in {"credit","payment","sale"}:
        raise HTTPException(400,"Invalid transaction kind.")
    con=conn_db()
    cur=con.execute("INSERT INTO transactions(customer,kind,amount,note,created_at) VALUES(?,?,?,?,?)",
        (customer,body.kind,round(body.amount,2),body.note.strip(),datetime.datetime.now().isoformat(timespec="seconds")))
    con.commit()
    row=con.execute("SELECT * FROM transactions WHERE id=?",(cur.lastrowid,)).fetchone()
    bal=balance_for(con,customer)
    con.close()
    return {"transaction":dict(row),"balance":bal}

@app.get("/api/customers")
def customers():
    return list_customers()

@app.get("/api/transactions")
def transactions(limit:int=50):
    limit=max(1,min(limit,200))
    con=conn_db(); rows=con.execute("SELECT * FROM transactions ORDER BY id DESC LIMIT ?",(limit,)).fetchall(); con.close()
    return [dict(r) for r in rows]

@app.get("/api/customer/{customer}/statement")
def get_statement(customer:str):
    con=conn_db(); result=statement_for(con,customer); con.close()
    if not result["transactions"]: raise HTTPException(404,"No transactions found.")
    result["generated_at"]=datetime.datetime.now().isoformat(timespec="seconds")
    return result

@app.delete("/api/demo-data")
def clear_data():
    con=conn_db(); con.execute("DELETE FROM transactions"); con.commit(); con.close()
    return {"ok":True}
