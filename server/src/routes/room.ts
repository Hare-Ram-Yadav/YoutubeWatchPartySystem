import { Router } from 'express';
import { RoomManager } from '../models/RoomManager.js';

const router = Router();
const roomManager = RoomManager.getInstance();

// Create a new Watch Room
router.post('/create', (req, res) => {
  try {
    const { name, hostUserId, initialVideoId } = req.body;

    if (!name || !hostUserId) {
      return res.status(400).json({ error: 'Room name and host user ID are required' });
    }

    // Extract YouTube video ID if full URL passed
    let videoId = initialVideoId || 'dQw4w9WgXcQ';
    if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
      const match = videoId.match(/(?:v=|\/embed\/|\/1\/|\/v\/|https:\/\/youtu\.be\/|\/watch\?v=)([^#&?]*)/);
      if (match && match[1].length === 11) {
        videoId = match[1];
      }
    }

    const room = roomManager.createRoom(name, hostUserId, videoId);
    return res.json({ roomId: room.id, roomState: room.toState() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create room' });
  }
});

// Get Room Metadata / State
router.get('/:roomId', (req, res) => {
  const room = roomManager.getRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.json({ roomState: room.toState() });
});

// List Active Public Rooms
router.get('/', (req, res) => {
  const publicRooms = roomManager.getAllPublicRooms();
  return res.json({ rooms: publicRooms });
});

export default router;
