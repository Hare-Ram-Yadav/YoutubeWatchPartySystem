import React, { useState, useEffect } from 'react';
import { Compass, Play, Search, Radio, History, ArrowRight, Flame, RefreshCw } from 'lucide-react';
import type { WatchHistoryItem, YouTubeSearchResult } from '../types';
import { getBackendUrl } from '../services/socket';

interface ExploreViewProps {
  onStartRoomWithVideo: (videoUrlOrId: string, title?: string) => void;
  onJoinRoomById: (roomId: string) => void;
  userId?: string;
  onOpenSearchModal: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  onStartRoomWithVideo,
  onJoinRoomById,
  userId = 'default_user',
  onOpenSearchModal,
}) => {
  const [activeTab, setActiveTab] = useState<'trending' | 'rooms' | 'history'>('trending');
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const SERVER_URL = getBackendUrl();

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Public Rooms
      const roomRes = await fetch(`${SERVER_URL}/api/rooms`);
      const roomData = await roomRes.json();
      if (roomData.rooms) {
        setPublicRooms(roomData.rooms);
      }

      // 2. Fetch User Watch History
      const histRes = await fetch(`${SERVER_URL}/api/history/${userId}`);
      const histData = await histRes.json();
      if (histData.history) {
        setWatchHistory(histData.history);
      }
    } catch (err) {
      console.warn('Failed to fetch explore data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const trendingVideos: YouTubeSearchResult[] = [
    {
      videoId: 'L_LUpnjgPso',
      title: 'How to Build Better Products — Keynote on Product Strategy',
      description: 'Learn scalable UI architecture, micro-interactions, and real-time multiplayer systems in modern tech.',
      channelTitle: 'Design & Tech 2025',
      thumbnailUrl: 'https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg',
      duration: '42:18',
    },
    {
      videoId: 'fJ9rUzIMcZQ',
      title: 'Our Planet — Ambient Coastal Forests & Marine Sanctuaries (4K)',
      description: 'Immersive ultra-HD cinematic footage of coastal rainforests, kelp ecosystems, and marine wildlife.',
      channelTitle: 'Nature & Wildlife 4K',
      thumbnailUrl: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
      duration: '58:00',
    },
    {
      videoId: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
      description: 'The iconic official music video remaster.',
      channelTitle: 'Rick Astley',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      duration: '3:33',
    },
    {
      videoId: '9bZkp7q19f0',
      title: 'PSY - GANGNAM STYLE(강남스타일) M/V',
      description: 'Official music video with over 5 billion views.',
      channelTitle: 'Officialpsy',
      thumbnailUrl: 'https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg',
      duration: '4:13',
    },
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      
      {/* Top Banner Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '1rem',
        padding: '1.75rem 2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Compass size={20} color="#DC2626" />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              DISCOVER & EXPLORE
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#0F172A' }}>
            Explore Trending Streams & Active Rooms
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748B', margin: 0 }}>
            Discover active public watch parties, search millions of YouTube videos, or resume your previous watch sessions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onOpenSearchModal}
            className="btn-primary"
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
          >
            <Search size={16} /> Search YouTube
          </button>
          <button
            onClick={loadData}
            className="btn-secondary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="explore-filter-pills" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('trending')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'trending' ? '#DC2626' : '#FFFFFF',
            color: activeTab === 'trending' ? '#FFFFFF' : '#475569',
            boxShadow: activeTab === 'trending' ? '0 2px 4px rgba(220,38,38,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Flame size={16} /> Popular Streams
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'rooms' ? '#DC2626' : '#FFFFFF',
            color: activeTab === 'rooms' ? '#FFFFFF' : '#475569',
            boxShadow: activeTab === 'rooms' ? '0 2px 4px rgba(220,38,38,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Radio size={16} /> Active Public Rooms ({publicRooms.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'history' ? '#DC2626' : '#FFFFFF',
            color: activeTab === 'history' ? '#FFFFFF' : '#475569',
            boxShadow: activeTab === 'history' ? '0 2px 4px rgba(220,38,38,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <History size={16} /> Watch History ({watchHistory.length})
        </button>
      </div>

      {/* Tab Content 1: Popular Trending Videos */}
      {activeTab === 'trending' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {trendingVideos.map((video) => (
            <div
              key={video.videoId}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#000' }}>
                <img src={video.thumbnailUrl} alt={video.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                {video.duration && (
                  <span style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    color: '#FFF',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                  }}>
                    {video.duration}
                  </span>
                )}
              </div>

              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563EB', marginBottom: '0.25rem' }}>
                    {video.channelTitle}
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#0F172A', lineHeight: 1.35 }}>
                    {video.title}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {video.description}
                  </p>
                </div>

                <button
                  onClick={() => onStartRoomWithVideo(video.videoId, video.title)}
                  className="btn-primary"
                  style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                >
                  <Play size={16} fill="#FFF" /> Host Watch Party
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content 2: Active Public Rooms */}
      {activeTab === 'rooms' && (
        <div>
          {publicRooms.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.75rem', padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
              <Radio size={36} color="#DC2626" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
                No active public watch rooms right now
              </h3>
              <p style={{ fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
                Be the first to create a watch room and invite your friends to stream together!
              </p>
              <button onClick={() => onStartRoomWithVideo('dQw4w9WgXcQ', 'New Watch Room')} className="btn-primary">
                Create First Room
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {publicRooms.map((room) => (
                <div
                  key={room.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '0.75rem',
                    border: '1px solid #E2E8F0',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                        ● LIVE STREAM
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>
                        CODE: {room.id}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: '#0F172A' }}>
                      {room.name || 'Watch Room'}
                    </h3>

                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '0.75rem' }}>
                      Host ID: <strong style={{ color: '#0F172A' }}>{room.hostId}</strong> • {room.participantCount || 1} connected viewers
                    </div>
                  </div>

                  <button
                    onClick={() => onJoinRoomById(room.id)}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                  >
                    Join Watch Room <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Watch History */}
      {activeTab === 'history' && (
        <div>
          {watchHistory.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.75rem', padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
              <History size={36} color="#64748B" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
                No watch history recorded yet
              </h3>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                Join or host a watch party to automatically save your session records and last host history.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {watchHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '0.75rem',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '90px', height: '54px', borderRadius: '0.375rem', overflow: 'hidden', backgroundColor: '#000', flexShrink: 0 }}>
                      <img src={item.thumbnailUrl || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`} alt={item.videoTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#0F172A' }}>
                        {item.videoTitle}
                      </h4>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>Room: <strong style={{ color: '#0F172A' }}>{item.roomName}</strong> ({item.roomId})</span>
                        <span>•</span>
                        <span>Host: <strong style={{ color: '#0F172A' }}>{item.hostName}</strong></span>
                        <span>•</span>
                        <span>{new Date(item.watchedAt).toLocaleDateString()} {new Date(item.watchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => onJoinRoomById(item.roomId)}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                    >
                      Rejoin Room
                    </button>
                    <button
                      onClick={() => onStartRoomWithVideo(item.videoId, item.videoTitle)}
                      className="btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                    >
                      Host Again
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
