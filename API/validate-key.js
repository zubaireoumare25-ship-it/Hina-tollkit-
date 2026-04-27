// ============================================================
// api/validate-key.js  —  HINA TOOLKIT
// POST /api/validate-key
// Body: { key: "HINA-XXXX", deviceId: "DEV-ABC" }
// Firebase REST API — no env vars, no npm packages needed
// ============================================================

const FIREBASE_DB_URL = "https://hina-tollkit-c7c72-default-rtdb.firebaseio.com";
const FIREBASE_API_KEY = "AIzaSyDDSRdiwaL7IPqQt6Rc";

// Firebase REST — get all keys
async function fbGet(path) {
  const url = `${FIREBASE_DB_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Firebase GET failed: " + res.status);
  return res.json();
}

// Firebase REST — update specific fields
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

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { key, deviceId } = req.body || {};
  if (!key) return res.status(400).json({ error: "Key is required" });

  try {
    // Fetch all keys from Firebase
    const data = await fbGet("keys");

    if (!data) return res.status(200).json({ valid: false, error: "❌ Please contact admin and get key" });

    // Find matching key
    const entries = Object.entries(data);
    const entry = entries.find(([, k]) => k.key === key.trim());

    if (!entry) {
      return res.status(200).json({ valid: false, error: "❌ Please contact admin and get key" });
    }

    const [fbId, keyObj] = entry;

    // Status: expired
    if (keyObj.status === "expired") {
      return res.status(200).json({ valid: false, error: "❌ This key has expired." });
    }

    // Date expiry check
    if (keyObj.expiry) {
      let expDate;
      if (/^\d{10,13}$/.test(String(keyObj.expiry))) {
        const ts = Number(keyObj.expiry);
        expDate = new Date(ts > 9999999999 ? ts : ts * 1000);
      } else {
        expDate = new Date(keyObj.expiry);
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(keyObj.expiry))) {
          expDate.setHours(23, 59, 59, 999);
        }
      }
      if (!isNaN(expDate) && expDate < new Date()) {
        return res.status(200).json({ valid: false, error: "❌ Key has expired." });
      }
    }

    // Device lock check
    if (keyObj.status === "used" && keyObj.deviceId && keyObj.deviceId !== deviceId) {
      return res.status(200).json({
        valid: false,
        error: "🔒 This key is already locked to another device.",
      });
    }

    // First use — bind device
    if (!keyObj.deviceId && deviceId) {
      await fbPatch(`keys/${fbId}`, {
        status: "used",
        deviceId: deviceId,
        usedBy: "device_" + deviceId,
      });
    }

    return res.status(200).json({
      valid: true,
      plan:            keyObj.plan || "Unknown",
      expiry:          keyObj.expiry || null,
      expiryTimestamp: keyObj.expiryTimestamp || null,
      planDays:        keyObj.planDays || 0,
      key:             keyObj.key || key,
    });

  } catch (err) {
    console.error("validate-key error:", err.message);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
};
