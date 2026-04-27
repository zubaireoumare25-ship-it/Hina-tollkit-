// ============================================================
// api/tools.js  —  HINA TOOLKIT
// GET    /api/tools  → list all tools (public)
// POST   /api/tools  → add tool (admin)
// DELETE /api/tools  → delete tool (admin)
// PUT    /api/tools  → update tool (admin)
// Firebase REST API — no env vars, no npm packages needed
// ============================================================

const FIREBASE_DB_URL = "https://hina-tollkit-c7c72-default-rtdb.firebaseio.com";
const FIREBASE_API_KEY = "AIzaSyDDSRdiwaL7IPqQt6Rc";

// Admin password — same as keys.js
const ADMIN_PASSWORD = "hina@admin2024";

async function fbGet(path) {
  const url = `${FIREBASE_DB_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Firebase GET failed: " + res.status);
  return res.json();
}

async function fbPost(path, data) {
  const url = `${FIREBASE_DB_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Firebase POST failed: " + res.status);
  return res.json();
}

async function fbPatch(path, data) {
  const url = `${FIREBASE_DB_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Firebase PATCH failed: " + res.status);
  return res.json();
}

async function fbDelete(path) {
  const url = `${FIREBASE_DB_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error("Firebase DELETE failed: " + res.status);
  return true;
}

function isAdmin(req) {
  return req.headers["x-admin-secret"] === ADMIN_PASSWORD;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-secret");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET: all tools (public, no auth needed) ──
  if (req.method === "GET") {
    try {
      const data = await fbGet("tools");
      const tools = data ? Object.values(data) : [];
      return res.status(200).json({ tools });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST: add tool ──
  if (req.method === "POST") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const tool = req.body;
    if (!tool || !tool.name) return res.status(400).json({ error: "Tool name required" });
    try {
      const result = await fbPost("tools", tool);
      // store the firebase id inside the tool object too
      await fbPatch(`tools/${result.name}`, { id: result.name });
      return res.status(200).json({ created: { id: result.name, ...tool } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PUT: update tool ──
  if (req.method === "PUT") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const { id, updates } = req.body || {};
    if (!id || !updates) return res.status(400).json({ error: "id and updates required" });
    try {
      await fbPatch(`tools/${id}`, updates);
      return res.status(200).json({ updated: id });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE: remove tool ──
  if (req.method === "DELETE") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "Tool id required" });
    try {
      await fbDelete(`tools/${id}`);
      return res.status(200).json({ deleted: id });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
