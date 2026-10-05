import { Room } from './Room.js';
import { Participant } from './Participant.js';
import { getDb } from '../db/database.js';
import { Role } from '../types/index.js';

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Room> = new Map(); // roomId -> Room

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public async initializeFromDb(): Promise<void> {
    try {
      const db = await getDb();
      const dbRooms = await db.all(`SELECT * FROM rooms`);

      for (const r of dbRooms) {
        const room = new Room(r.id, r.name, r.host_id, r.current_video_id);
        room.playback.isPlaying = Boolean(r.is_playing);
        room.playback.currentTime = r.current_time;
        room.playback.lastUpdated = r.last_updated;
        room.modCanManageRoles = Boolean(r.mod_can_manage_roles);
        room.createdAt = r.created_at;

        // Load participants
        const dbParticipants = await db.all(`SELECT * FROM room_participants WHERE room_id = ?`, r.id);
        for (const p of dbParticipants) {
          const participant = new Participant({
            userId: p.user_id,
            username: p.username,
            role: p.role as Role,
            socketId: '',
            joinedAt: p.joined_at,
          });
          participant.isOnline = false; // Will mark online when socket connects
          room.participants.set(p.user_id, participant);
        }

        // Load pending action requests
        const dbRequests = await db.all(`SELECT * FROM action_requests WHERE room_id = ? AND status = 'pending'`, r.id);
        for (const req of dbRequests) {
          room.pendingRequests.push({
            id: req.id,
            roomId: req.room_id,
            userId: req.user_id,
            username: req.username,
            actionType: req.action_type,
            payload: req.payload ? JSON.parse(req.payload) : undefined,
            status: req.status,
            createdAt: req.created_at,
          });
        }

        // Load chat history
        const dbChats = await db.all(`SELECT * FROM chat_messages WHERE room_id = ? ORDER BY timestamp DESC LIMIT 50`, r.id);
        room.chatHistory = dbChats.reverse().map(c => ({
          id: c.id,
          roomId: c.room_id,
          userId: c.user_id,
          username: c.username,
          userRole: c.user_role as Role,
          text: c.text,
          timestamp: c.timestamp,
        }));

        this.rooms.set(r.id, room);
      }
      console.log(`[RoomManager] Initialized ${this.rooms.size} persistent rooms from database.`);
    } catch (err) {
      console.error(`[RoomManager] Error restoring rooms from DB:`, err);
    }
  }

  public createRoom(name: string, hostUserId: string, initialVideoId: string = 'dQw4w9WgXcQ'): Room {
    const roomId = this.generateRoomId();
    const room = new Room(roomId, name, hostUserId, initialVideoId);
    this.rooms.set(roomId, room);
    return room;
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  public getAllPublicRooms(): { id: string; name: string; participantCount: number; videoId: string }[] {
    return Array.from(this.rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      participantCount: r.participants.size,
      videoId: r.playback.videoId,
    }));
  }

  private generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }
}
