import { useState, useEffect } from 'react';
import { socket, connectSocket, disconnectSocket, getBackendUrl } from './services/socket';
import type { RoomState, Role, EmojiReaction, YouTubeSearchResult } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { YouTubePlayer } from './components/YouTubePlayer';
import { ParticipantsList } from './components/ParticipantsList';
import { LiveChat } from './components/LiveChat';
import { ActionRequestsBanner } from './components/ActionRequestsBanner';
import { ExploreView } from './components/ExploreView';
import { ChangeVideoModal } from './modals/ChangeVideoModal';
import { TransferHostModal } from './modals/TransferHostModal';
import { YouTubeSearchModal } from './components/YouTubeSearchModal';
import { PreferencesModal } from './components/PreferencesModal';
import { UserProfileModal } from './components/UserProfileModal';
import { Video, ShieldCheck, Crown, AlertCircle } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myRole, setMyRole] = useState<Role>('participant');
  
  // App view tabs
  const [activeTab, setActiveTab] = useState<'watch' | 'explore'>('watch');

  // Modals state
  const [isChangeVideoOpen, setIsChangeVideoOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [transferHostTarget, setTransferHostTarget] = useState<{ id: string; name: string } | null>(null);

  const handleOpenSearchModal = (query?: string) => {
    setSearchInitialQuery(query || '');
    setIsSearchModalOpen(true);
  };

  // Floating Reactions & Notifications
  const [floatingReactions, setFloatingReactions] = useState<EmojiReaction[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const roomCodeFromUrl = urlParams.get('room') || '';

  const SERVER_URL = getBackendUrl();

  useEffect(() => {
    connectSocket();

    socket.on('room_joined', (data: { roomState: RoomState; myRole: Role; myUsername?: string }) => {
      setRoomState(data.roomState);
      setMyRole(data.myRole);
      setErrorMessage(null);
      if (data.myUsername) {
        const confirmedName: string = data.myUsername;
        setCurrentUser(prev => prev ? { id: prev.id, username: confirmedName } : { id: 'usr_me', username: confirmedName });
      }
      saveWatchHistory(data.roomState);
    });

    socket.on('user_joined', (data: { roomState: RoomState }) => {
      setRoomState(data.roomState);
    });

    socket.on('sync_state', (data: { playState: string; currentTime: number; videoId: string; roomState?: RoomState }) => {
      if (data.roomState) {
        setRoomState(data.roomState);
        saveWatchHistory(data.roomState);
      } else {
        setRoomState((prev) => {
          if (!prev) return prev;
          const next = {
            ...prev,
            playback: {
              ...prev.playback,
              videoId: data.videoId,
              isPlaying: data.playState === 'playing',
              currentTime: data.currentTime,
              lastUpdated: Date.now(),
            },
          };
          saveWatchHistory(next);
          return next;
        });
      }
    });

    socket.on('state_changed', (data: { roomState?: RoomState; playback: any }) => {
      if (data.roomState) {
        setRoomState(data.roomState);
        saveWatchHistory(data.roomState);
      } else {
        setRoomState((prev) => {
          if (!prev) return prev;
          const nextState = { ...prev, playback: data.playback };
          saveWatchHistory(nextState);
          return nextState;
        });
      }
    });

    socket.on('queue_updated', (data: { queue: any }) => {
      setRoomState((prev) => (prev ? { ...prev, queue: data.queue } : prev));
    });

    socket.on('role_assigned', (data: { roomState: RoomState }) => {
      setRoomState(data.roomState);
    });

    socket.on('my_role_updated', (data: { newRole: Role }) => {
      setMyRole(data.newRole);
    });

    socket.on('participant_removed', (data: { roomState: RoomState }) => {
      setRoomState(data.roomState);
    });

    socket.on('host_transferred', (data: { roomState: RoomState }) => {
      setRoomState(data.roomState);
      if (currentUser?.id) {
        const meInRoom = data.roomState.participants.find((p) => p.userId === currentUser.id);
        if (meInRoom) {
          setMyRole(meInRoom.role);
        }
      }
    });

    socket.on('request_submitted', (data: { roomState: RoomState }) => {
      setRoomState(data.roomState);
    });

    socket.on('request_resolved', (data: { roomState: RoomState }) => {
      setRoomState(data.roomState);
    });

    socket.on('chat_message_received', (data: { message: any }) => {
      setRoomState((prev) => (prev ? { ...prev, chatHistory: [...prev.chatHistory, data.message] } : prev));
    });

    socket.on('reaction_received', (data: EmojiReaction) => {
      setFloatingReactions((prev) => [...prev, data]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== data.id));
      }, 2200);
    });

    socket.on('kicked_from_room', (data: { message: string }) => {
      alert(data.message || 'You have been removed from the room.');
      setRoomState(null);
    });

    socket.on('error_message', (data: { message: string }) => {
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    return () => {
      socket.off('room_joined');
      socket.off('user_joined');
      socket.off('sync_state');
      socket.off('state_changed');
      socket.off('queue_updated');
      socket.off('role_assigned');
      socket.off('my_role_updated');
      socket.off('participant_removed');
      socket.off('host_transferred');
      socket.off('request_submitted');
      socket.off('request_resolved');
      socket.off('chat_message_received');
      socket.off('reaction_received');
      socket.off('kicked_from_room');
      socket.off('error_message');
    };
  }, [currentUser?.id]);

  const saveWatchHistory = (room: RoomState) => {
    if (!currentUser?.id || !room) return;
    try {
      fetch(`${SERVER_URL}/api/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          roomId: room.id,
          roomName: room.name,
          hostName: currentUser.username || 'Host',
          videoId: room.playback.videoId,
          videoTitle: room.playback.title || 'YouTube Stream',
          videoDescription: room.playback.description || '',
          thumbnailUrl: room.playback.thumbnailUrl || `https://img.youtube.com/vi/${room.playback.videoId}/mqdefault.jpg`,
        }),
      }).catch(err => console.warn('Save history error:', err));
    } catch (err) {
      console.warn('Save history failed:', err);
    }
  };

  const handleCreateRoom = async (username: string, name: string, videoUrl: string) => {
    const userId = currentUser?.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setCurrentUser({ id: userId, username });

    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, hostUserId: userId, initialVideoId: videoUrl }),
      });
      const data = await res.json();
      if (data.roomId) {
        socket.emit('join_room', {
          roomId: data.roomId,
          userId,
          username,
        });
        setActiveTab('watch');
      }
    } catch (err) {
      console.error('Create room error:', err);
      setErrorMessage('Failed to create room. Ensure backend server is running.');
    }
  };

  const handleJoinRoom = (username: string, roomId: string) => {
    const userId = currentUser?.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setCurrentUser({ id: userId, username });

    socket.emit('join_room', {
      roomId,
      userId,
      username,
    });
    setActiveTab('watch');
  };

  const handlePlaybackChange = (action: 'play' | 'pause' | 'seek', targetTime?: number) => {
    if (action === 'play') {
      socket.emit('play', { time: targetTime });
    } else if (action === 'pause') {
      socket.emit('pause', { time: targetTime });
    } else if (action === 'seek') {
      socket.emit('seek', { time: targetTime });
    }
    socket.emit('playback_action', { action, targetTime, time: targetTime });
  };

  const handleConfirmChangeVideo = (videoUrlOrId: string, title?: string, description?: string, channelTitle?: string, thumbnailUrl?: string) => {
    let videoId = videoUrlOrId;
    const match = videoUrlOrId.match(/(?:v=|\/embed\/|\/1\/|\/v\/|https:\/\/youtu\.be\/|\/watch\?v=)([^#&?]*)/);
    if (match && match[1].length === 11) {
      videoId = match[1];
    }

    if (myRole === 'host' || myRole === 'moderator') {
      socket.emit('change_video', { videoId, title, description, channelTitle, thumbnailUrl });
      socket.emit('playback_action', {
        action: 'change_video',
        videoId,
        title: title || 'YouTube Broadcast Video',
        description,
        channelTitle,
        thumbnailUrl,
      });
    } else {
      socket.emit('submit_request', {
        actionType: 'change_video',
        payload: { videoId, videoTitle: title, videoDescription: description },
      });
    }
  };

  const handleBroadcastSearchResult = (result: YouTubeSearchResult) => {
    handleConfirmChangeVideo(result.videoId, result.title, result.description, result.channelTitle, result.thumbnailUrl);
  };

  const handleRequestVideo = (result: YouTubeSearchResult) => {
    socket.emit('submit_request', {
      actionType: 'change_video',
      payload: { videoId: result.videoId, videoTitle: result.title, videoDescription: result.description },
    });
  };

  const handleAddToQueue = (videoId: string, title: string) => {
    socket.emit('add_to_queue', { videoId, title });
  };

  const handleRequestAction = (action: 'play' | 'pause') => {
    socket.emit('submit_request', { actionType: action });
  };

  const handleAssignRole = (targetUserId: string, newRole: Role) => {
    socket.emit('assign_role', { userId: targetUserId, role: newRole, targetUserId, newRole });
  };

  const handleRemoveParticipant = (targetUserId: string) => {
    if (window.confirm('Are you sure you want to remove this participant from the room?')) {
      socket.emit('remove_participant', { userId: targetUserId, targetUserId });
    }
  };

  const handleConfirmTransferHost = (newHostUserId: string) => {
    socket.emit('transfer_host', { userId: newHostUserId, newHostUserId, targetUserId: newHostUserId });
  };

  const handleResolveRequest = (requestId: string, status: 'approved' | 'rejected') => {
    socket.emit('resolve_request', { requestId, status });
  };

  const handleSendChat = (text: string) => {
    socket.emit('send_chat', { text });
  };

  const handleSendReaction = (emoji: string) => {
    socket.emit('send_reaction', { emoji });
  };

  const handleLeaveRoom = () => {
    disconnectSocket();
    setRoomState(null);
    setCurrentUser(null);
    connectSocket();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Floating Emoji Reactions Overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99, overflow: 'hidden' }}>
        {floatingReactions.map((r, i) => (
          <div
            key={r.id}
            className="floating-reaction"
            style={{
              left: `${20 + (i % 6) * 12}%`,
              bottom: '15%',
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Notifications / Alert Banner */}
      {errorMessage && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          color: '#991B1B',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 90,
          fontWeight: 600,
          fontSize: '0.85rem',
        }}>
          <AlertCircle size={18} />
          {errorMessage}
        </div>
      )}

      {/* View router */}
      {activeTab === 'explore' ? (
        <ExploreView
          userId={currentUser?.id || 'guest_user'}
          onStartRoomWithVideo={(videoId, title) => {
            handleCreateRoom(currentUser?.username || 'Alex Johnson', title || 'Watch Party', videoId);
          }}
          onJoinRoomById={(roomId) => {
            handleJoinRoom(currentUser?.username || 'Guest User', roomId);
          }}
          onOpenSearchModal={() => handleOpenSearchModal()}
        />
      ) : !roomState ? (
        <LandingPage
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          initialRoomCode={roomCodeFromUrl}
        />
      ) : (
        <main className="main-layout-container">
          {/* Top Status Bar */}
          <div className="top-status-bar">
            <div className="status-info-group">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: myRole === 'host' ? '#FEE2E2' : '#EFF6FF',
                color: myRole === 'host' ? '#991B1B' : '#1E40AF',
                border: myRole === 'host' ? '1px solid #FCA5A5' : '1px solid #BFDBFE',
                borderRadius: '0.5rem',
                padding: '0.3rem 0.75rem',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}>
                {myRole === 'host' ? <Crown size={16} /> : <ShieldCheck size={16} />}
                <span>
                  {myRole === 'host' ? 'Welcome, Showrunner!' : myRole === 'moderator' ? 'Moderator Controls Active' : 'Participant Watch-Only'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748B' }}>
                <span style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                  Synced
                </span>
                <span>ROOM CODE: <strong style={{ color: '#0F172A', letterSpacing: '0.05em' }}>{roomState.id}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => handleOpenSearchModal()}
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Video size={16} />
                <span>{myRole === 'host' || myRole === 'moderator' ? 'Change Video' : 'Search & Request Video'}</span>
              </button>
            </div>
          </div>

          {(myRole === 'host' || myRole === 'moderator') && (
            <div>
              <ActionRequestsBanner
                pendingRequests={roomState.pendingRequests}
                onResolveRequest={handleResolveRequest}
              />
            </div>
          )}

          {/* Main Content Section */}
          <div className="main-content-section">
            <div className="player-main-column">
              <YouTubePlayer
                playback={roomState.playback}
                myRole={myRole}
                queue={roomState.queue}
                onPlaybackChange={handlePlaybackChange}
                onConfirmChangeVideo={handleConfirmChangeVideo}
                onAddToQueue={handleAddToQueue}
                onRequestAction={handleRequestAction}
                onOpenSearchModal={(q) => handleOpenSearchModal(q)}
              />
            </div>

            <div className="sidebar-main-column">
              <div className="live-chat-wrapper">
                <LiveChat
                  chatHistory={roomState.chatHistory}
                  onSendChat={handleSendChat}
                  onSendReaction={handleSendReaction}
                  reactions={floatingReactions}
                />
              </div>

              <div className="participants-wrapper">
                <ParticipantsList
                  participants={roomState.participants}
                  myUserId={currentUser?.id || ''}
                  myRole={myRole}
                  hostId={roomState.hostId}
                  onAssignRole={handleAssignRole}
                  onRemoveParticipant={handleRemoveParticipant}
                  onOpenTransferHostModal={(id, name) => setTransferHostTarget({ id, name })}
                />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Footer Navigation Bar */}
      <Navbar
        roomName={roomState?.name}
        roomId={roomState?.id}
        myRole={myRole}
        username={currentUser?.username}
        participantCount={roomState?.participants.length || 0}
        activeTab={activeTab}
        onNavigateTab={(tab) => {
          if (tab === 'preferences') {
            setIsPreferencesOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenCreateRoom={() => {
          setRoomState(null);
          setActiveTab('watch');
        }}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onOpenSearchModal={() => handleOpenSearchModal()}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Modals */}
      <ChangeVideoModal
        isOpen={isChangeVideoOpen}
        onClose={() => setIsChangeVideoOpen(false)}
        onConfirmChangeVideo={handleConfirmChangeVideo}
        isParticipant={myRole === 'participant'}
      />

      <YouTubeSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => {
          setIsSearchModalOpen(false);
          setSearchInitialQuery('');
        }}
        onSelectBroadcastVideo={handleBroadcastSearchResult}
        onAddToQueue={handleAddToQueue}
        isParticipant={myRole === 'participant'}
        onRequestVideo={handleRequestVideo}
        initialQuery={searchInitialQuery}
      />

      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        userId={currentUser?.id || 'guest_user'}
        onSavePreferences={(prefs) => {
          console.log('[Preferences Saved]', prefs);
        }}
      />

      <TransferHostModal
        isOpen={Boolean(transferHostTarget)}
        onClose={() => setTransferHostTarget(null)}
        targetUserId={transferHostTarget?.id || ''}
        targetUsername={transferHostTarget?.name || ''}
        currentHostName={currentUser?.username || 'Host'}
        onConfirmTransfer={handleConfirmTransferHost}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={currentUser?.id || 'usr_session'}
        username={currentUser?.username || 'Alex Johnson'}
        myRole={myRole}
        onUpdateUsername={(newUsername) => {
          setCurrentUser((prev) => prev ? { ...prev, username: newUsername } : { id: `usr_${Date.now()}`, username: newUsername });
        }}
      />
    </div>
  );
}
export default App;
