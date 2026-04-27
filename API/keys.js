// ============================================================
// api/keys.js  —  HINA TOOLKIT Admin
// GET    /api/keys  → list all keys
// POST   /api/keys  → create new key(s)
// DELETE /api/keys  → delete key by fbId
// PUT    /api/keys  → update key status/deviceId
// Firebase REST API — no env vars, no npm packages needed
// ============================================================

const FIREBASE_DB_URL = "https://hina-tollkit-c7c72-default-rtdb.firebaseio.com";
const FIREBASE_API_KEY = "AIzaSyDDSRdiwaL7IPqQt6Rc";

// Admin password — hardcoded (change karo apna chahiye to)
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

  // ── GET: list all keys ──
  if (req.method === "GET") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    try {
      const data = await fbGet("keys");
      const keys = data
        ? Object.entries(data).map(([fbId, k]) => ({ fbId, ...k }))
        : [];
      return res.status(200).json({ keys });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST: create key(s) ──
  if (req.method === "POST") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const { keys } = req.body || {};
    if (!keys || !Array.isArray(keys)) {
      return res.status(400).json({ error: 'Send { keys: [...] }' });
    }
    try {
      const created = [];
      for (const k of keys) {
        const result = await fbPost("keys", { ...k, status: "active" });
        created.push({ fbId: result.name, ...k });
      }
      return res.status(200).json({ created });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PUT: update key ──
  if (req.method === "PUT") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const { fbId, updates } = req.body || {};
    if (!fbId || !updates) return res.status(400).json({ error: "fbId and updates required" });
    try {
      await fbPatch(`keys/${fbId}`, updates);
      return res.status(200).json({ updated: fbId });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE: remove key ──
  if (req.method === "DELETE") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const { fbId } = req.body || {};
    if (!fbId) return res.status(400).json({ error: "fbId required" });
    try {
      await fbDelete(`keys/${fbId}`);
      return res.status(200).json({ deleted: fbId });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
