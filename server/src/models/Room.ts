import { Participant } from './Participant.js';
import { PlaybackState, Role, ActionRequest, ChatMessage, RoomState, QueueItem } from '../types/index.js';
import { getDb } from '../db/database.js';

export class Room {
  public id: string;
  public name: string;
  public hostId: string;
  public playback: PlaybackState;
  public participants: Map<string, Participant> = new Map();
  public pendingRequests: ActionRequest[] = [];
  public chatHistory: ChatMessage[] = [];
  public queue: QueueItem[] = [];
  public modCanManageRoles: boolean = false;
  public createdAt: number;

  constructor(id: string, name: string, hostId: string, initialVideoId: string = 'dQw4w9WgXcQ') {
    this.id = id;
    this.name = name;
    this.hostId = hostId;
    this.createdAt = Date.now();

    this.playback = {
      videoId: initialVideoId,
      isPlaying: false,
      currentTime: 0,
      lastUpdated: Date.now(),
      title: 'How to Build Better Products — Keynote on Product Strategy & Design',
    };

    // Default sample queue items matching screenshot
    this.queue = [
      {
        id: 'q1',
        videoId: 'L_LUpnjgPso',
        title: 'Typography & Micro-Interactions for WatchParty',
        thumbnailUrl: 'https://img.youtube.com/vi/L_LUpnjgPso/mqdefault.jpg',
        addedBy: 'Alex Johnson',
      },
      {
        id: 'q2',
        videoId: 'fJ9rUzIMcZQ',
        title: 'Design Systems & Scalable UI Architecture 2025',
        thumbnailUrl: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/mqdefault.jpg',
        addedBy: 'Sarah Miller',
      },
      {
        id: 'q3',
        videoId: '9bZkp7q19f0',
        title: 'Our Planet — Ambient Coastal Forests (4K)',
        thumbnailUrl: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg',
        addedBy: 'Alex Johnson',
      },
    ];
  }

  public getCurrentPlaybackState(): PlaybackState {
    let calculatedTime = this.playback.currentTime;
    if (this.playback.isPlaying) {
      const elapsedSeconds = (Date.now() - this.playback.lastUpdated) / 1000;
      calculatedTime += elapsedSeconds;
    }
    return {
      ...this.playback,
      currentTime: calculatedTime,
    };
  }

  public updatePlayback(
    videoId?: string,
    isPlaying?: boolean,
    currentTime?: number,
    updatedBy?: string,
    title?: string,
    description?: string,
    channelTitle?: string,
    thumbnailUrl?: string
  ): PlaybackState {
    const currentState = this.getCurrentPlaybackState();

    if (videoId !== undefined && videoId !== this.playback.videoId) {
      this.playback.videoId = videoId;
      this.playback.currentTime = 0;
      if (title) this.playback.title = title;
      if (description !== undefined) this.playback.description = description;
      if (channelTitle) this.playback.channelTitle = channelTitle;
      if (thumbnailUrl) this.playback.thumbnailUrl = thumbnailUrl;
    } else if (currentTime !== undefined) {
      this.playback.currentTime = currentTime;
    } else {
      this.playback.currentTime = currentState.currentTime;
    }

    if (title) this.playback.title = title;
    if (description !== undefined) this.playback.description = description;
    if (channelTitle) this.playback.channelTitle = channelTitle;
    if (thumbnailUrl) this.playback.thumbnailUrl = thumbnailUrl;

    if (isPlaying !== undefined) {
      this.playback.isPlaying = isPlaying;
    }

    this.playback.lastUpdated = Date.now();
    if (updatedBy) {
      this.playback.updatedBy = updatedBy;
    }

    this.saveToDb();
    return this.getCurrentPlaybackState();
  }

  public addQueueItem(item: Omit<QueueItem, 'id'>): QueueItem {
    const queueItem: QueueItem = {
      ...item,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.queue.push(queueItem);
    return queueItem;
  }

  public removeQueueItem(id: string): boolean {
    const initialLen = this.queue.length;
    this.queue = this.queue.filter(q => q.id !== id);
    return this.queue.length < initialLen;
  }

  public getUniqueUsername(proposedName: string, userId: string): string {
    const baseName = (proposedName || 'Guest').trim();
    if (!baseName) return 'Guest';

    const existingSelf = this.participants.get(userId);
    if (existingSelf && existingSelf.username.toLowerCase().startsWith(baseName.toLowerCase())) {
      return existingSelf.username;
    }

    const otherUsernames = new Set(
      Array.from(this.participants.values())
        .filter(p => p.userId !== userId)
        .map(p => p.username.toLowerCase())
    );

    if (!otherUsernames.has(baseName.toLowerCase())) {
      return baseName;
    }

    let counter = 2;
    while (otherUsernames.has(`${baseName.toLowerCase()} #${counter}`)) {
      counter++;
    }

    return `${baseName} #${counter}`;
  }

  public addParticipant(participant: Participant): void {
    participant.username = this.getUniqueUsername(participant.username, participant.userId);
    const existing = this.participants.get(participant.userId);
    if (existing) {
      existing.socketId = participant.socketId;
      existing.isOnline = true;
      existing.username = participant.username;
    } else {
      this.participants.set(participant.userId, participant);
    }
    this.saveParticipantToDb(participant);
  }

  public removeParticipant(userId: string): Participant | undefined {
    const participant = this.participants.get(userId);
    if (participant) {
      this.participants.delete(userId);
      this.deleteParticipantFromDb(userId);
    }
    return participant;
  }

  public getParticipant(userId: string): Participant | undefined {
    return this.participants.get(userId);
  }

  public isHost(userId: string): boolean {
    return this.hostId === userId;
  }

  public isModerator(userId: string): boolean {
    const p = this.getParticipant(userId);
    return p?.role === 'moderator' || this.isHost(userId);
  }

  public canManagePlayback(userId: string): boolean {
    const p = this.getParticipant(userId);
    if (!p) return false;
    return p.role === 'host' || p.role === 'moderator';
  }

  public canManageRoles(userId: string): boolean {
    const p = this.getParticipant(userId);
    if (!p) return false;
    if (p.role === 'host') return true;
    if (p.role === 'moderator' && this.modCanManageRoles) return true;
    return false;
  }

  public assignRole(targetUserId: string, newRole: Role, assignedByUserId: string): boolean {
    if (!this.canManageRoles(assignedByUserId)) {
      throw new Error('Unauthorized to assign roles');
    }

    const target = this.getParticipant(targetUserId);
    if (!target) return false;

    if (targetUserId === this.hostId && newRole !== 'host') {
      throw new Error('Cannot change host role directly. Use host transfer.');
    }

    target.role = newRole;
    this.saveParticipantToDb(target);
    return true;
  }

  public transferHost(newHostUserId: string, currentHostUserId: string): boolean {
    if (this.hostId !== currentHostUserId) {
      throw new Error('Only the current Host can transfer ownership');
    }

    const newHost = this.getParticipant(newHostUserId);
    if (!newHost) return false;

    const oldHost = this.getParticipant(currentHostUserId);
    if (oldHost) {
      oldHost.role = 'moderator';
      this.saveParticipantToDb(oldHost);
    }

    newHost.role = 'host';
    this.hostId = newHostUserId;
    this.saveParticipantToDb(newHost);
    this.saveToDb();
    return true;
  }

  public createActionRequest(request: Omit<ActionRequest, 'id' | 'status' | 'createdAt'>): ActionRequest {
    const newReq: ActionRequest = {
      ...request,
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'pending',
      createdAt: Date.now(),
    };
    this.pendingRequests.push(newReq);
    this.saveActionRequestToDb(newReq);
    return newReq;
  }

  public resolveActionRequest(requestId: string, status: 'approved' | 'rejected', resolverUserId: string): ActionRequest | null {
    if (!this.canManagePlayback(resolverUserId)) {
      throw new Error('Unauthorized to resolve action requests');
    }

    const req = this.pendingRequests.find(r => r.id === requestId);
    if (!req) return null;

    req.status = status;
    if (status === 'approved') {
      if (req.actionType === 'change_video' && req.payload?.videoId) {
        this.updatePlayback(req.payload.videoId, true, 0, req.username, req.payload.videoTitle);
      } else if (req.actionType === 'play') {
        this.updatePlayback(undefined, true, undefined, req.username);
      } else if (req.actionType === 'pause') {
        this.updatePlayback(undefined, false, undefined, req.username);
      } else if (req.actionType === 'seek' && req.payload?.targetTime !== undefined) {
        this.updatePlayback(undefined, undefined, req.payload.targetTime, req.username);
      }
    }

    this.pendingRequests = this.pendingRequests.filter(r => r.id !== requestId);
    this.updateActionRequestInDb(req);
    return req;
  }

  public addChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const fullMsg: ChatMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    this.chatHistory.push(fullMsg);
    if (this.chatHistory.length > 100) {
      this.chatHistory.shift();
    }
    this.saveChatMessageToDb(fullMsg);
    return fullMsg;
  }

  public toState(): RoomState {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      playback: this.getCurrentPlaybackState(),
      participants: Array.from(this.participants.values()).map(p => p.toJSON()),
      pendingRequests: this.pendingRequests.filter(r => r.status === 'pending'),
      chatHistory: this.chatHistory.slice(-50),
      queue: this.queue,
      modCanManageRoles: this.modCanManageRoles,
    };
  }

  private async saveToDb() {
    try {
      const db = await getDb();
      await db.run(
        `INSERT OR REPLACE INTO rooms (id, name, host_id, current_video_id, is_playing, current_time, last_updated, mod_can_manage_roles, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        this.id,
        this.name,
        this.hostId,
        this.playback.videoId,
        this.playback.isPlaying ? 1 : 0,
        this.playback.currentTime,
        this.playback.lastUpdated,
        this.modCanManageRoles ? 1 : 0,
        this.createdAt
      );
    } catch (err) {
      console.error(`[DB Error] Failed to save room ${this.id}:`, err);
    }
  }

  private async saveParticipantToDb(participant: Participant) {
    try {
      const db = await getDb();
      await db.run(
        `INSERT OR REPLACE INTO room_participants (room_id, user_id, username, role, joined_at)
         VALUES (?, ?, ?, ?, ?)`,
        this.id,
        participant.userId,
        participant.username,
        participant.role,
        participant.joinedAt
      );
    } catch (err) {
      console.error(`[DB Error] Failed to save participant ${participant.userId}:`, err);
    }
  }

  private async deleteParticipantFromDb(userId: string) {
    try {
      const db = await getDb();
      await db.run(`DELETE FROM room_participants WHERE room_id = ? AND user_id = ?`, this.id, userId);
    } catch (err) {
      console.error(`[DB Error] Failed to delete participant ${userId}:`, err);
    }
  }

  private async saveChatMessageToDb(msg: ChatMessage) {
    try {
      const db = await getDb();
      await db.run(
        `INSERT INTO chat_messages (id, room_id, user_id, username, user_role, text, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        msg.id, msg.roomId, msg.userId, msg.username, msg.userRole, msg.text, msg.timestamp
      );
    } catch (err) {
      console.error(`[DB Error] Failed to save chat message:`, err);
    }
  }

  private async saveActionRequestToDb(req: ActionRequest) {
    try {
      const db = await getDb();
      await db.run(
        `INSERT INTO action_requests (id, room_id, user_id, username, action_type, payload, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        req.id, req.roomId, req.userId, req.username, req.actionType, JSON.stringify(req.payload || {}), req.status, req.createdAt
      );
    } catch (err) {
      console.error(`[DB Error] Failed to save action request:`, err);
    }
  }

  private async updateActionRequestInDb(req: ActionRequest) {
    try {
      const db = await getDb();
      await db.run(
        `UPDATE action_requests SET status = ? WHERE id = ?`,
        req.status, req.id
      );
    } catch (err) {
      console.error(`[DB Error] Failed to update action request:`, err);
    }
  }
}
