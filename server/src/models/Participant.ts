import { Role, ParticipantData } from '../types/index.js';

export class Participant {
  public userId: string;
  public username: string;
  public role: Role;
  public socketId: string;
  public isOnline: boolean;
  public avatarUrl?: string;
  public joinedAt: number;

  constructor(data: {
    userId: string;
    username: string;
    role: Role;
    socketId: string;
    avatarUrl?: string;
    joinedAt?: number;
  }) {
    this.userId = data.userId;
    this.username = data.username;
    this.role = data.role;
    this.socketId = data.socketId;
    this.isOnline = true;
    this.avatarUrl = data.avatarUrl;
    this.joinedAt = data.joinedAt || Date.now();
  }

  public toJSON(): ParticipantData {
    return {
      userId: this.userId,
      username: this.username,
      role: this.role,
      socketId: this.socketId,
      isOnline: this.isOnline,
      avatarUrl: this.avatarUrl,
      joinedAt: this.joinedAt,
    };
  }
}
