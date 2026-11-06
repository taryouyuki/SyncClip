import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

interface ClipboardRecord {
  id: string;
  encryptedPayload: string;
  iv: string;
  salt: string;
  hash: string;
  device: {
    id: string;
    name: string;
    type: 'windows' | 'android' | 'tablet' | 'web';
    networkName?: string;
  };
  timestamp: number;
}

interface DeviceRecord {
  id: string;
  name: string;
  type: 'windows' | 'android' | 'tablet' | 'web';
  networkName: string;
  lastSeen: number;
  ip?: string;
}

// In-memory sync state
let clipboardHistory: ClipboardRecord[] = [];
let pairedDevices: Map<string, DeviceRecord> = new Map();
let sseClients: { id: string; res: express.Response }[] = [];

// Broadcast helper for SSE
function broadcast(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      // client may have disconnected
    }
  });
}

// Clean up stale devices every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [id, dev] of pairedDevices.entries()) {
    if (now - dev.lastSeen > 60000) {
      pairedDevices.delete(id);
      broadcast('device_offline', { id });
    }
  }
}, 30000);

// API Routes
app.get('/api/sync/status', (req, res) => {
  res.json({
    status: 'online',
    activeDevices: pairedDevices.size,
    historyCount: clipboardHistory.length,
    timestamp: Date.now(),
  });
});

app.get('/api/sync/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  sseClients.push({ id: clientId, res });

  // Initial event
  res.write(`event: init\ndata: ${JSON.stringify({ clientId, history: clipboardHistory.slice(0, 50) })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

app.get('/api/sync/history', (req, res) => {
  res.json(clipboardHistory);
});

app.post('/api/sync/push', (req, res) => {
  const { id, encryptedPayload, iv, salt, hash, device, timestamp } = req.body;

  if (!encryptedPayload || !device) {
    return res.status(400).json({ error: 'Missing required payload or device info' });
  }

  const record: ClipboardRecord = {
    id: id || `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    encryptedPayload,
    iv: iv || '',
    salt: salt || '',
    hash: hash || '',
    device: {
      id: device.id || 'unknown',
      name: device.name || 'Unknown Device',
      type: device.type || 'web',
      networkName: device.networkName || 'Unknown Network',
    },
    timestamp: timestamp || Date.now(),
  };

  // Prepend to history, avoid duplicate consecutive payloads
  const isDuplicate = clipboardHistory.length > 0 && clipboardHistory[0].hash === record.hash;
  if (!isDuplicate) {
    clipboardHistory.unshift(record);
    if (clipboardHistory.length > 100) {
      clipboardHistory.pop();
    }
  }

  // Update sending device
  pairedDevices.set(record.device.id, {
    id: record.device.id,
    name: record.device.name,
    type: record.device.type,
    networkName: record.device.networkName || 'Local Network',
    lastSeen: Date.now(),
  });

  // Broadcast to all clients
  broadcast('new_clip', record);
  broadcast('device_update', Array.from(pairedDevices.values()));

  res.json({ success: true, id: record.id });
});

app.post('/api/sync/clear', (req, res) => {
  clipboardHistory = [];
  broadcast('history_cleared', {});
  res.json({ success: true });
});

app.get('/api/devices', (req, res) => {
  res.json(Array.from(pairedDevices.values()));
});

app.post('/api/devices/heartbeat', (req, res) => {
  const { id, name, type, networkName } = req.body;
  if (!id) return res.status(400).json({ error: 'Device ID required' });

  pairedDevices.set(id, {
    id,
    name: name || 'Device',
    type: type || 'web',
    networkName: networkName || 'Default Network',
    lastSeen: Date.now(),
  });

  broadcast('device_update', Array.from(pairedDevices.values()));
  res.json({ success: true, count: pairedDevices.size });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SyncClip Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
