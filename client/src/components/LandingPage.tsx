import React, { useState } from 'react';
import { Play, ArrowRight, Copy, Check, ShieldCheck, Crown, Users, Radio, Settings } from 'lucide-react';

interface LandingPageProps {
  onCreateRoom: (username: string, roomName: string, initialVideoUrl: string) => void;
  onJoinRoom: (username: string, roomId: string) => void;
  initialRoomCode?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onCreateRoom,
  onJoinRoom,
  initialRoomCode = ''
}) => {
  const [username, setUsername] = useState('Alex Johnson');
  const [roomName, setRoomName] = useState("Alex Johnson's Watch Party");
  const [isCustomRoomName, setIsCustomRoomName] = useState(false);
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  
  const [joinUsername, setJoinUsername] = useState('Guest User');
  const [joinRoomId, setJoinRoomId] = useState(initialRoomCode);
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'waiting'>('create');
  const [copiedCode, setCopiedCode] = useState(false);

  // Host Waiting Room Permissions State
  const [modCanControl, setModCanControl] = useState(true);
  const [requireHostApproval, setRequireHostApproval] = useState(false);
  const [allowChatReactions, setAllowChatReactions] = useState(true);

  const handleHostNameChange = (newName: string) => {
    setUsername(newName);
    if (!isCustomRoomName) {
      const trimmed = newName.trim();
      setRoomName(trimmed ? `${trimmed}'s Watch Party` : "Watch Party");
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !roomName.trim()) return;
    onCreateRoom(username.trim(), roomName.trim(), videoUrl.trim());
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinUsername.trim() || !joinRoomId.trim()) return;
    onJoinRoom(joinUsername.trim(), joinRoomId.trim().toUpperCase());
  };

  const copySampleCode = () => {
    navigator.clipboard.writeText('WK8F2A');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      
      {/* Top Breadcrumb & Step Navigator matching Screenshot */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SYNC ORCHESTRATOR • Onboarding Flow v2.4
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
            Room Entry & Staging Sandbox
          </h2>
        </div>

        {/* 3 Step Navigator Pills (Option 3 fully functional) */}
        <div style={{
          display: 'flex',
          backgroundColor: '#F1F5F9',
          borderRadius: '9999px',
          padding: '0.25rem',
          border: '1px solid #E2E8F0',
          gap: '0.25rem',
          flexWrap: 'wrap',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            style={{
              border: 'none',
              borderRadius: '9999px',
              padding: '0.35rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: activeTab === 'create' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'create' ? '#DC2626' : '#64748B',
              boxShadow: activeTab === 'create' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
            1. Create Room
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('join')}
            style={{
              border: 'none',
              borderRadius: '9999px',
              padding: '0.35rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: activeTab === 'join' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'join' ? '#2563EB' : '#64748B',
              boxShadow: activeTab === 'join' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
            2. Join Room
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('waiting')}
            style={{
              border: 'none',
              borderRadius: '9999px',
              padding: '0.35rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: activeTab === 'waiting' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'waiting' ? '#D97706' : '#64748B',
              boxShadow: activeTab === 'waiting' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97706' }} />
            3. Host Waiting Room
          </button>
        </div>
      </div>

      {/* Main Grid matching Screenshot Layout */}
      <div className="landing-grid-container">
        
        {/* Left Side: Host Form / Staging Control depending on activeTab */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          border: '1px solid #E2E8F0',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}>
          {activeTab === 'waiting' ? (
            /* Option 3: Host Waiting Room View */
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                letterSpacing: '0.05em',
              }}>
                <Crown size={14} />
                HOST WAITING ROOM • Pre-Stream Lobby & Staging Sandbox
              </div>

              <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                Pre-Stream Host Control Lobby
              </h1>
              <p style={{ fontSize: '0.95rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Stage your YouTube broadcast, configure guest permissions, copy your invite link, and review waiting participants before going live.
              </p>

              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="landing-input-grid">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      Host Display Name
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => handleHostNameChange(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.9rem',
                        backgroundColor: '#F8FAFC',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      Watch Room Name
                    </label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => {
                        setRoomName(e.target.value);
                        setIsCustomRoomName(true);
                      }}
                      placeholder="e.g. Friday Movie Night"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.9rem',
                        backgroundColor: '#F8FAFC',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    Staged YouTube Video URL / Video ID
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      backgroundColor: '#F8FAFC',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Pre-stream Room Rules Box */}
                <div style={{
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#92400E', fontWeight: 800, fontSize: '0.85rem' }}>
                    <Settings size={16} />
                    Pre-Stream Permission & Sync Rules
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={modCanControl}
                      onChange={(e) => setModCanControl(e.target.checked)}
                      style={{ accentColor: '#D97706' }}
                    />
                    <span>Allow Host-appointed Moderators to play, pause & seek timeline</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={requireHostApproval}
                      onChange={(e) => setRequireHostApproval(e.target.checked)}
                      style={{ accentColor: '#D97706' }}
                    />
                    <span>Require Host approval for video changes requested by participants</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowChatReactions}
                      onChange={(e) => setAllowChatReactions(e.target.checked)}
                      style={{ accentColor: '#D97706' }}
                    />
                    <span>Enable real-time text chat & floating emoji reactions</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', backgroundColor: '#D97706', minWidth: '180px' }}>
                    <Radio size={18} />
                    Launch Watch Party Now
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('join')}
                    className="btn-secondary"
                    style={{ fontSize: '0.9rem', padding: '0.85rem 1.25rem' }}
                  >
                    Have a code?
                  </button>

                  <button
                    type="button"
                    onClick={copySampleCode}
                    className="btn-secondary"
                    style={{ fontSize: '0.9rem', padding: '0.85rem 1.25rem', color: '#D97706' }}
                  >
                    <Copy size={16} />
                    Copy Code
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === 'join' ? (
            /* Option 2: Join Room View */
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#EFF6FF',
                color: '#1E40AF',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                letterSpacing: '0.05em',
              }}>
                <Users size={14} />
                JOIN EXISTING WATCH ROOM
              </div>

              <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                Join a Watch Session.
              </h1>
              <p style={{ fontSize: '0.95rem', color: '#64748B', marginBottom: '1.75rem', lineHeight: 1.6 }}>
                Enter a 6-character room code or invite link to join an active synchronized stream immediately.
              </p>

              <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    Your Display Name
                  </label>
                  <input
                    type="text"
                    value={joinUsername}
                    onChange={(e) => setJoinUsername(e.target.value)}
                    placeholder="e.g. Guest User"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.95rem',
                      backgroundColor: '#F8FAFC',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    6-Character Room Code
                  </label>
                  <input
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                    placeholder="WK8F2A"
                    maxLength={6}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      letterSpacing: '0.15em',
                      backgroundColor: '#F8FAFC',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', backgroundColor: '#2563EB' }}>
                    <Users size={18} />
                    Enter Watch Room
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('waiting')}
                    className="btn-secondary"
                    style={{ fontSize: '0.9rem', padding: '0.85rem 1.25rem' }}
                  >
                    Open Host Lobby
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Option 1: Create Room View */
            <div>
              {/* Badge pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                letterSpacing: '0.05em',
              }}>
                <ShieldCheck size={14} />
                HOST CONSOLE • Real-time low-latency synchronization
              </div>

              <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                Watch YouTube together.
              </h1>
              <p style={{ fontSize: '0.95rem', color: '#64748B', marginBottom: '1.75rem', lineHeight: 1.6 }}>
                Create a synchronized cinema room, paste any video link, and broadcast in perfect frame-lock to friends anywhere.
              </p>

              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    Your Display Name
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleHostNameChange(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.95rem',
                      backgroundColor: '#F8FAFC',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => {
                      setRoomName(e.target.value);
                      setIsCustomRoomName(true);
                    }}
                    placeholder="e.g. Friday Movie Night"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.95rem',
                      backgroundColor: '#F8FAFC',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.3rem', display: 'block' }}>
                    This will be displayed in the shared room toolbar and participant invites.
                  </span>
                </div>

                {/* Host Master Authority Notice Box */}
                <div style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E40AF' }}>Host Master Authority</span>
                      <span style={{ backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Automatic</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                      You'll manage timeline scrubbing, playback rate, playlist queuing, and guest permissions.
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', minWidth: '180px' }}>
                    <Play size={18} fill="#FFFFFF" />
                    ⊕ Create Watch Room
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('join')}
                    className="btn-secondary"
                    style={{ fontSize: '0.9rem', padding: '0.85rem 1.25rem' }}
                  >
                    Have a code?
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('waiting')}
                    className="btn-secondary"
                    style={{ fontSize: '0.9rem', padding: '0.85rem 1.25rem', color: '#D97706', borderColor: '#FDE68A' }}
                  >
                    Open Host Lobby
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Feature Badges Cards (Matching Screenshot) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #F1F5F9',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>SYNC ACCURACY</div>
              <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0F172A' }}>&lt; 15 ms</div>
              <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>Micro-drift correction</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>MAX CAPACITY</div>
              <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0F172A' }}>100 Guests</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Unlimited host swaps</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>AUDIO QUALITY</div>
              <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0F172A' }}>Direct HQ</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Native stream audio</div>
            </div>
          </div>
        </div>

        {/* Right Side: Room Generated Staging Card matching Screenshot */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          border: '1px solid #E2E8F0',
          padding: '1.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  {activeTab === 'waiting' ? 'Host Waiting Room Lobby' : 'Room Generated'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  {activeTab === 'waiting' ? 'Staging & Guest Waiting List' : 'Ready to broadcast invite'}
                </span>
              </div>
              <span style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                ID: #WK8F2A
              </span>
            </div>

            {/* Video Thumbnail Preview Frame */}
            <div style={{
              position: 'relative',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              border: '1px solid #CBD5E1',
              marginBottom: '1.5rem',
            }}>
              <img
                src="https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
                alt="Queued Preview"
                style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
              />
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: 'rgba(0,0,0,0.85)',
                color: '#FFFFFF',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
              }}>
                1080p60 Sync
              </span>

              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                right: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                color: '#FFFFFF',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span style={{ backgroundColor: '#DC2626', padding: '0.1rem 0.4rem', borderRadius: '3px', fontSize: '0.65rem' }}>STAGED PREVIEW</span>
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Our Planet — Ambient Coastal Forests (4K)</span>
              </div>
            </div>

            {/* Direct Room Code Card */}
            <div style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>DIRECT ROOM CODE</span>
                <span style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 700 }}>Active Session</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A', letterSpacing: '0.15em' }}>
                  WK8F2A
                </span>
                <button
                  type="button"
                  onClick={copySampleCode}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '0.5rem',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: '#1E40AF',
                  }}
                >
                  {copiedCode ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                  {copiedCode ? 'Copied' : 'Copy Code'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'join') {
                    if (joinRoomId.trim()) onJoinRoom(joinUsername.trim(), joinRoomId.trim().toUpperCase());
                  } else {
                    onCreateRoom(username.trim(), roomName.trim(), videoUrl.trim());
                  }
                }}
                style={{
                  backgroundColor: activeTab === 'waiting' ? '#D97706' : '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.85rem',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {activeTab === 'waiting' ? '🚀 Launch Watch Party' : 'Enter Watch Room'}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Footer Avatar Queue Stack */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#64748B',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', marginLeft: '0.5rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#DC2626', color: '#FFF', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FFF' }}>AJ</div>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#2563EB', color: '#FFF', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FFF', marginLeft: '-8px' }}>SM</div>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#16A34A', color: '#FFF', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FFF', marginLeft: '-8px' }}>+3</div>
              </div>
              <span>5 friends waiting in queue</span>
            </div>
            <span style={{ color: '#DC2626', fontWeight: 700 }}>No login required</span>
          </div>
        </div>
      </div>
    </div>
  );
};
