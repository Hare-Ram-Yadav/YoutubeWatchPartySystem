export type Role = 'host' | 'moderator' | 'participant' | 'viewer';

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface ParticipantData {
  userId: string;
  username: string;
  role: Role;
  socketId: string;
  isOnline: boolean;
  avatarUrl?: string;
  joinedAt: number;
  latency?: string;
  statusText?: string;
}

export interface PlaybackState {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
  updatedBy?: string;
  title?: string;
  description?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
}

export interface WatchHistoryItem {
  id: string;
  userId: string;
  roomId: string;
  roomName: string;
  hostName: string;
  videoId: string;
  videoTitle: string;
  videoDescription?: string;
  thumbnailUrl?: string;
  watchedAt: number;
}

export interface UserPreferences {
  userId: string;
  autoplay: boolean;
  syncThreshold: number;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration?: string;
}

export interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  addedBy: string;
  duration?: string;
}

export interface ActionRequest {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  actionType: 'play' | 'pause' | 'seek' | 'change_video';
  payload?: {
    videoId?: string;
    targetTime?: number;
    videoTitle?: string;
    videoDescription?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  userRole: Role;
  text: string;
  timestamp: number;
}

export interface RoomState {
  id: string;
  name: string;
  hostId: string;
  playback: PlaybackState;
  participants: ParticipantData[];
  pendingRequests: ActionRequest[];
  chatHistory: ChatMessage[];
  queue: QueueItem[];
  modCanManageRoles?: boolean;
}
