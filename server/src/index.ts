import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/room.js';
import featureRoutes from './routes/features.js';
import { setupSocketHandlers } from './handlers/socketHandler.js';
import { RoomManager } from './models/RoomManager.js';
import { getDb } from './db/database.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;

// CORS setup for local development and production deployments
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api', featureRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files if built
const clientDistPath = path.join(process.cwd(), '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.send('YouTube Watch Party Backend Active. Client dist not found.');
    }
  });
});

// Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocketHandlers(io);

// Startup Initialization
async function startServer() {
  try {
    // 1. Initialize DB
    await getDb();

    // 2. Load Persistent Rooms from Database
    const roomManager = RoomManager.getInstance();
    await roomManager.initializeFromDb();

    httpServer.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`  🚀 YouTube Watch Party Server running on port ${PORT}`);
      console.log(`  📡 WebSocket Server initialized`);
      console.log(`  💾 SQLite Persistence database active`);
      console.log(`==================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
