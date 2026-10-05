import { Server, Socket } from 'socket.io';
import { RoomManager } from '../models/RoomManager.js';
import { Participant } from '../models/Participant.js';
import { Role } from '../types/index.js';

export class MessageHandler {
  private io: Server;
  private roomManager: RoomManager;

  constructor(io: Server) {
    this.io = io;
    this.roomManager = RoomManager.getInstance();
  }

  public registerSocketEvents(socket: Socket): void {
    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    // 1. JOIN ROOM ({ roomId, username, userId })
    socket.on('join_room', (data: { roomId: string; username: string; userId?: string; avatarUrl?: string }) => {
      try {
        const { roomId, username, avatarUrl } = data;
        const userId = data.userId || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const room = this.roomManager.getRoom(roomId);

        if (!room) {
          socket.emit('error_message', { message: `Room ${roomId} not found.` });
          return;
        }

        const uniqueUsername = room.getUniqueUsername(username, userId);

        let assignedRole: Role = 'participant';
        if (room.isHost(userId)) {
          assignedRole = 'host';
        } else {
          const existing = room.getParticipant(userId);
          if (existing) {
            assignedRole = existing.role;
          }
        }

        const participant = new Participant({
          userId,
          username: uniqueUsername,
          role: assignedRole,
          socketId: socket.id,
          avatarUrl,
        });

        room.addParticipant(participant);
        currentRoomId = room.id;
        currentUserId = userId;

        socket.join(room.id);

        // Send room_joined and initial sync_state to joiner
        socket.emit('room_joined', {
          roomState: room.toState(),
          myRole: assignedRole,
          myUsername: participant.username,
        });

        socket.emit('sync_state', {
          playState: room.playback.isPlaying ? 'playing' : 'paused',
          currentTime: room.getCurrentPlaybackState().currentTime,
          videoId: room.playback.videoId,
          roomState: room.toState(),
        });

        // Broadcast user_joined per PDF Table Spec: { username, userId, role, participants }
        this.io.to(room.id).emit('user_joined', {
          username: participant.username,
          userId: participant.userId,
          role: participant.role,
          participants: Array.from(room.participants.values()).map(p => p.toJSON()),
          roomState: room.toState(),
        });

        console.log(`[MessageHandler] ${username} (${assignedRole}) joined room ${room.id}`);
      } catch (err: any) {
        socket.emit('error_message', { message: err.message || 'Failed to join room' });
      }
    });

    // 2. LEAVE ROOM ({ roomId })
    socket.on('leave_room', (data: { roomId: string }) => {
      if (currentRoomId && currentUserId) {
        const room = this.roomManager.getRoom(currentRoomId);
        if (room) {
          const participant = room.getParticipant(currentUserId);
          if (participant) {
            participant.isOnline = false;
            this.io.to(room.id).emit('user_left', {
              username: participant.username,
              userId: currentUserId,
              participants: Array.from(room.participants.values()).map(p => p.toJSON()),
              roomState: room.toState(),
            });
          }
        }
        socket.leave(data.roomId);
        currentRoomId = null;
      }
    });

    // 3. DISCRETE PLAYBACK EVENTS per PDF Table Specification
    // A. PLAY ({})
    socket.on('play', (data?: { time?: number; targetTime?: number }) => {
      this.handlePlaybackChange(socket, currentRoomId, currentUserId, 'play', data?.targetTime ?? data?.time);
    });

    // B. PAUSE ({})
    socket.on('pause', (data?: { time?: number; targetTime?: number }) => {
      this.handlePlaybackChange(socket, currentRoomId, currentUserId, 'pause', data?.targetTime ?? data?.time);
    });

    // C. SEEK ({ time })
    socket.on('seek', (data: { time?: number; targetTime?: number }) => {
      this.handlePlaybackChange(socket, currentRoomId, currentUserId, 'seek', data?.time ?? data?.targetTime);
    });

    // D. CHANGE_VIDEO ({ videoId, title, description, channelTitle, thumbnailUrl })
    socket.on('change_video', (data: { videoId: string; title?: string; description?: string; channelTitle?: string; thumbnailUrl?: string }) => {
      this.handlePlaybackChange(socket, currentRoomId, currentUserId, 'change_video', undefined, data?.videoId, data?.title, data?.description, data?.channelTitle, data?.thumbnailUrl);
    });

    // E. General playback_action wrapper
    socket.on('playback_action', (data: {
      action: 'play' | 'pause' | 'seek' | 'change_video';
      videoId?: string;
      targetTime?: number;
      time?: number;
      title?: string;
      description?: string;
      channelTitle?: string;
      thumbnailUrl?: string;
    }) => {
      this.handlePlaybackChange(socket, currentRoomId, currentUserId, data.action, data.targetTime ?? data.time, data.videoId, data.title, data.description, data.channelTitle, data.thumbnailUrl);
    });

    // 4. ROLE MANAGEMENT
    // A. ASSIGN ROLE per PDF Table Spec: { userId, role } (Host Only)
    socket.on('assign_role', (data: { userId?: string; targetUserId?: string; role?: Role; newRole?: Role }) => {
      try {
        const targetUserId = data.userId || data.targetUserId;
        const newRole = data.role || data.newRole;

        if (!currentRoomId || !currentUserId || !targetUserId || !newRole) return;
        const room = this.roomManager.getRoom(currentRoomId);
        if (!room) return;

        // Role enforcement on backend
        if (!room.isHost(currentUserId) && !room.canManageRoles(currentUserId)) {
          socket.emit('error_message', { message: 'Permission denied. Only Host can assign roles.' });
          return;
        }

        room.assignRole(targetUserId, newRole, currentUserId);
        const targetP = room.getParticipant(targetUserId);

        // Broadcast role_assigned per PDF Table Spec: { userId, username, role, participants }
        this.io.to(room.id).emit('role_assigned', {
          userId: targetUserId,
          username: targetP?.username || 'User',
          role: newRole,
          participants: Array.from(room.participants.values()).map(p => p.toJSON()),
          roomState: room.toState(),
        });

        if (targetP && targetP.socketId) {
          this.io.to(targetP.socketId).emit('my_role_updated', { newRole: newRole });
        }
      } catch (err: any) {
        socket.emit('error_message', { message: err.message || 'Assign role failed' });
      }
    });

    // B. REMOVE PARTICIPANT per PDF Table Spec: { userId } (Host Only)
    socket.on('remove_participant', (data: { userId?: string; targetUserId?: string }) => {
      try {
        const targetUserId = data.userId || data.targetUserId;
        if (!currentRoomId || !currentUserId || !targetUserId) return;
        const room = this.roomManager.getRoom(currentRoomId);
        if (!room) return;

        if (!room.isHost(currentUserId)) {
          socket.emit('error_message', { message: 'Permission denied. Only Host can remove participants.' });
          return;
        }

        const removedP = room.removeParticipant(targetUserId);

        if (removedP) {
          if (removedP.socketId) {
            this.io.to(removedP.socketId).emit('kicked_from_room', { message: 'You have been removed from the room by the host.' });
            const targetSocket = this.io.sockets.sockets.get(removedP.socketId);
            if (targetSocket) {
              targetSocket.leave(room.id);
            }
          }

          // Broadcast participant_removed per PDF Spec: { userId, participants }
          this.io.to(room.id).emit('participant_removed', {
            userId: targetUserId,
            participants: Array.from(room.participants.values()).map(p => p.toJSON()),
            roomState: room.toState(),
          });
        }
      } catch (err: any) {
        socket.emit('error_message', { message: err.message || 'Remove participant failed' });
      }
    });

    // C. TRANSFER HOST ({ newHostUserId / userId })
    socket.on('transfer_host', (data: { newHostUserId?: string; userId?: string; targetUserId?: string }) => {
      try {
        const newHostId = data.newHostUserId || data.userId || data.targetUserId;
        if (!currentRoomId || !currentUserId || !newHostId) return;
        const room = this.roomManager.getRoom(currentRoomId);
        if (!room) return;

        if (!room.isHost(currentUserId)) {
          socket.emit('error_message', { message: 'Permission denied. Only Host can transfer ownership.' });
          return;
        }

        room.transferHost(newHostId, currentUserId);

        this.io.to(room.id).emit('host_transferred', {
          newHostUserId: newHostId,
          participants: Array.from(room.participants.values()).map(p => p.toJSON()),
          roomState: room.toState(),
        });
      } catch (err: any) {
        socket.emit('error_message', { message: err.message || 'Host transfer failed' });
      }
    });

    // 5. QUEUE MANAGEMENT
    socket.on('add_to_queue', (data: { videoId: string; title: string }) => {
      try {
        if (!currentRoomId || !currentUserId) return;
        const room = this.roomManager.getRoom(currentRoomId);
        if (!room) return;

        const participant = room.getParticipant(currentUserId);
        const username = participant ? participant.username : 'User';

        const item = room.addQueueItem({
          videoId: data.videoId,
          title: data.title || 'YouTube Stream Video',
          thumbnailUrl: `https://img.youtube.com/vi/${data.videoId}/mqdefault.jpg`,
          addedBy: username,
        });

        this.io.to(room.id).emit('queue_updated', {
          queue: room.queue,
          newItem: item,
        });
      } catch (err: any) {
        socket.emit('error_message', { message: err.message || 'Failed to add to queue' });
      }
    });

    // 6. ACTION REQUEST WORKFLOW
    socket.on('submit_request', (data: {
      actionType: 'play' | 'pause' | 'seek' | 'change_video';
      payload?: any;
    }) => {
      try {
        if (!currentRoomId || !currentUserId) return;
        const room = this.roomManager.getRoom(currentRoomId);
        if (!room) return;

        const participant = room.getParticipant(currentUserId);
        if (!participant) return;

        const req = room.createActionRequest({
          roomId: room.id,
          userId: currentUserId,
          username: participant.username,
          actionType: data.actionType,
          payload: data.payload,
        });

        this.io.to(room.id).emit('request_submitted', {
          request: req,
          roomState: room.toState(),
        });
      } catch (err: any) {
        socket.emit('error_message', { message: err.message || 'Submit request failed' });
      }
    });

    socket.on('resolve_request', (data: { requestId: string; status: 'approved' | 'rejected' }) => {
      try {
        if (!currentRoomId || !currentUserId) return;
        const room = this.roomManager.getRoom(currentRoomId);
        if (!room) return;

        const resolvedReq = room.resolveActionRequest(data.requestId, data.status, currentUserId);

        if (resolvedReq) {
          this.io.to(room.id).emit('request_resolved', {
            request: resolvedReq,
            roomState: room.toState(),
            playback: room.getCurrentPlaybackState(),
          });
        }
      } catch (err: any) {
        socket.emit('error_message', { message: err.message || 'Resolve request failed' });
      }
    });

    // 7. CHAT MESSAGE
    socket.on('send_chat', (data: { text: string }) => {
      try {
        if (!currentRoomId || !currentUserId) return;
        const room = this.roomManager.getRoom(currentRoomId);
        if (!room) return;

        const participant = room.getParticipant(currentUserId);
        if (!participant || !data.text.trim()) return;

        const chatMsg = room.addChatMessage({
          roomId: room.id,
          userId: currentUserId,
          username: participant.username,
          userRole: participant.role,
          text: data.text.trim(),
        });

        this.io.to(room.id).emit('chat_message_received', { message: chatMsg });
      } catch (err: any) {
        socket.emit('error_message', { message: err.message || 'Failed to send chat' });
      }
    });

    // 8. EMOJI REACTION
    socket.on('send_reaction', (data: { emoji: string }) => {
      if (!currentRoomId || !currentUserId) return;
      const room = this.roomManager.getRoom(currentRoomId);
      if (!room) return;
      const participant = room.getParticipant(currentUserId);
      if (!participant) return;

      this.io.to(room.id).emit('reaction_received', {
        userId: currentUserId,
        username: participant.username,
        emoji: data.emoji,
        id: `react_${Date.now()}_${Math.random()}`,
      });
    });

    // 9. DISCONNECT
    socket.on('disconnect', () => {
      if (currentRoomId && currentUserId) {
        const room = this.roomManager.getRoom(currentRoomId);
        if (room) {
          const participant = room.getParticipant(currentUserId);
          if (participant && participant.socketId === socket.id) {
            participant.isOnline = false;
            this.io.to(room.id).emit('user_left', {
              username: participant.username,
              userId: currentUserId,
              participants: Array.from(room.participants.values()).map(p => p.toJSON()),
              roomState: room.toState(),
            });
          }
        }
      }
    });
  }

  // Internal Helper to process playback changes with strict RBAC enforcement
  private async handlePlaybackChange(
    socket: Socket,
    roomId: string | null,
    userId: string | null,
    action: 'play' | 'pause' | 'seek' | 'change_video',
    targetTime?: number,
    videoId?: string,
    title?: string,
    description?: string,
    channelTitle?: string,
    thumbnailUrl?: string
  ): Promise<void> {
    try {
      if (!roomId || !userId) return;
      const room = this.roomManager.getRoom(roomId);
      if (!room) return;

      // Backend RBAC Validation
      if (!room.canManagePlayback(userId)) {
        socket.emit('error_message', { message: 'Permission denied. Only Host or Moderator can control playback.' });
        return;
      }

      const participant = room.getParticipant(userId);
      const username = participant ? participant.username : 'User';

      let updatedState;
      if (action === 'play') {
        updatedState = room.updatePlayback(undefined, true, targetTime, username);
      } else if (action === 'pause') {
        updatedState = room.updatePlayback(undefined, false, targetTime, username);
      } else if (action === 'seek' && targetTime !== undefined) {
        updatedState = room.updatePlayback(undefined, undefined, targetTime, username);
      } else if (action === 'change_video' && videoId) {
        let finalTitle = title;
        let finalDesc = description;
        let finalChannel = channelTitle;
        let finalThumb = thumbnailUrl;

        // Auto fetch video details if title or description missing
        if (!finalTitle || !finalDesc) {
          try {
            const { fetchYouTubeVideoDetails } = await import('../services/youtubeService.js');
            const details = await fetchYouTubeVideoDetails(videoId);
            finalTitle = finalTitle || details.title;
            finalDesc = finalDesc || details.description;
            finalChannel = finalChannel || details.channelTitle;
            finalThumb = finalThumb || details.thumbnailUrl;
          } catch (err) {
            console.warn('[Fetch Video Details Fallback Failed]', err);
          }
        }

        updatedState = room.updatePlayback(
          videoId,
          true,
          0,
          username,
          finalTitle || 'YouTube Video',
          finalDesc || 'YouTube Stream Broadcast',
          finalChannel || 'YouTube Channel',
          finalThumb || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        );
      }

      // Broadcast sync_state per PDF Spec: { playState, currentTime, videoId }
      const currentPlayback = room.getCurrentPlaybackState();
      this.io.to(room.id).emit('sync_state', {
        playState: currentPlayback.isPlaying ? 'playing' : 'paused',
        currentTime: currentPlayback.currentTime,
        videoId: currentPlayback.videoId,
        roomState: room.toState(),
      });

      this.io.to(room.id).emit('state_changed', {
        playback: currentPlayback,
        triggeredBy: username,
        action,
        roomState: room.toState(),
      });
    } catch (err: any) {
      socket.emit('error_message', { message: err.message || 'Playback action failed' });
    }
  }
}

export function setupSocketHandlers(io: Server) {
  const handler = new MessageHandler(io);
  io.on('connection', (socket: Socket) => {
    handler.registerSocketEvents(socket);
  });
}
