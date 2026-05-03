const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set, update, remove } = require('firebase/database');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 🔴 FIREBASE SETUP (REAL DATA)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDDSRdiwaL7IPqQt6RonA-wnjB9aUV2y88",
  authDomain: "hina-tollkit-c7c72.firebaseapp.com",
  databaseURL: "https://hina-tollkit-c7c72-default-rtdb.firebaseio.com",
  projectId: "hina-tollkit-c7c72",
  storageBucket: "hina-tollkit-c7c72.firebasestorage.app",
  messagingSenderId: "552332199122",
  appId: "1:552332199122:web:1c66762958e36fff7e590b",
  measurementId: "G-BQEBJD4S3X"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// ==========================================
// 🟢 SYSTEM SETTINGS API ROUTES
// ==========================================

// Get Maintenance Status for Users
app.get('/api/settings', async (req, res) => {
    try {
        const snap = await get(ref(db, 'settings/maintenanceMode'));
        res.json({ maintenanceMode: snap.exists() ? snap.val() : false });
    } catch (error) {
        res.json({ maintenanceMode: false });
    }
});

// Admin Toggle Maintenance
app.post('/api/admin/toggle-maintenance', async (req, res) => {
    const { status } = req.body;
    try {
        await set(ref(db, 'settings/maintenanceMode'), status);
        res.json({ success: true, status });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// ==========================================
// 🟢 USER PANEL API ROUTES
// ==========================================

app.post('/api/validate-key', async (req, res) => {
    const { key, deviceId } = req.body;
    try {
        const snapshot = await get(ref(db, 'keys'));
        if (!snapshot.exists()) return res.json({ success: false, message: "No keys found." });
        
        const keysData = snapshot.val();
        let foundKeyId = null;
        let foundKey = null;

        for (const [id, k] of Object.entries(keysData)) {
            if (k.key === key) {
                foundKeyId = id;
                foundKey = k;
                break;
            }
        }

        if (!foundKey) return res.json({ success: false, message: "Invalid Key" });

        if (foundKey.status === 'used' && foundKey.deviceId && foundKey.deviceId !== deviceId) {
            return res.json({ success: false, message: "Key locked to another device." });
        }
        if (foundKey.status === 'expired') {
            return res.json({ success: false, message: "This key has expired." });
        }
        if (foundKey.expiryTimestamp && foundKey.expiryTimestamp < Date.now()) {
            await update(ref(db, `keys/${foundKeyId}`), { status: 'expired' });
            return res.json({ success: false, message: "Key has expired." });
        }
        if (foundKey.status !== 'used' || !foundKey.deviceId) {
            await update(ref(db, `keys/${foundKeyId}`), { status: 'used', deviceId: deviceId, usedBy: 'device_' + deviceId });
        }
        res.json({ success: true, plan: foundKey.plan, expiry: foundKey.expiry, expiryTimestamp: foundKey.expiryTimestamp });
    } catch (error) {
        res.json({ success: false, message: "Database Error: " + error.message });
    }
});

app.get('/api/get-tools', async (req, res) => {
    try {
        const snapshot = await get(ref(db, 'tools'));
        if (snapshot.exists()) res.json(Object.values(snapshot.val()));
        else res.json([]);
    } catch (error) { res.json([]); }
});

// ==========================================
// 🔵 ADMIN PANEL API ROUTES
// ==========================================

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    const SERVER_ADMIN_USER = "4660074hina";
    const SERVER_ADMIN_PASS = "4660074hina";

    if (username === SERVER_ADMIN_USER && password === SERVER_ADMIN_PASS) {
        res.json({ success: true, message: "Login Successful" });
    } else {
        res.json({ success: false, message: "Wrong Username or Password" });
    }
});

app.get('/api/admin/get-data', async (req, res) => {
    try {
        const keysSnap = await get(ref(db, 'keys'));
        const toolsSnap = await get(ref(db, 'tools'));
        res.json({ success: true, keys: keysSnap.exists() ? keysSnap.val() : {}, tools: toolsSnap.exists() ? toolsSnap.val() : {} });
    } catch (error) { res.json({ success: false, message: error.message }); }
});

app.post('/api/admin/save-keys', async (req, res) => {
    const { keys } = req.body;
    try {
        const updates = {};
        keys.forEach(k => { updates[`keys/${k.id}`] = k; });
        await update(ref(db), updates);
        res.json({ success: true });
    } catch (error) { res.json({ success: false, message: error.message }); }
});

app.post('/api/admin/delete-key', async (req, res) => {
    const { id } = req.body;
    try { await remove(ref(db, `keys/${id}`)); res.json({ success: true }); } catch (error) { res.json({ success: false }); }
});

app.post('/api/admin/clear-keys', async (req, res) => {
    try { await set(ref(db, 'keys'), {}); res.json({ success: true }); } catch (error) { res.json({ success: false }); }
});

app.post('/api/admin/update-tool', async (req, res) => {
    const { tool } = req.body;
    try { await set(ref(db, `tools/${tool.id}`), tool); res.json({ success: true }); } catch (error) { res.json({ success: false }); }
});

app.post('/api/admin/delete-tool', async (req, res) => {
    const { id } = req.body;
    try { await remove(ref(db, `tools/${id}`)); res.json({ success: true }); } catch (error) { res.json({ success: false }); }
});

module.exports = app;

if (require.main === module) {
    app.listen(3000, () => console.log('Server running on port 3000'));
}