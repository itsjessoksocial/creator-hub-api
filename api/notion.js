// Vercel Serverless Function — Notion API Proxy
// Keeps your NOTION_SECRET off the frontend.
// Deploy this to Vercel; set env vars in Vercel dashboard.

const NOTION_VERSION = "2022-06-28";
const NOTION_BASE = "https://api.notion.com/v1";

// ── CORS headers ──────────────────────────────────────────────────────────────
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // lock down to your GH Pages URL in prod
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const secret = process.env.NOTION_SECRET;
  if (!secret) return res.status(500).json({ error: "NOTION_SECRET not configured" });

  // ?path=/databases/{id}/query  or  /pages/{id}  etc.
  const notionPath = req.query.path;
  if (!notionPath) return res.status(400).json({ error: "Missing ?path= param" });

  const url = `${NOTION_BASE}${notionPath}`;
  const headers = {
    Authorization: `Bearer ${secret}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };

  try {
    const notionRes = await fetch(url, {
      method: req.method,
      headers,
      body: ["POST", "PATCH"].includes(req.method) ? JSON.stringify(req.body) : undefined,
    });

    const data = await notionRes.json();
    return res.status(notionRes.status).json(data);
  } catch (err) {
    console.error("Notion proxy error:", err);
    return res.status(500).json({ error: "Proxy request failed", detail: err.message });
  }
}
