import React, { useEffect, useRef, useState } from 'react';
import type { PlaybackState, Role, QueueItem } from '../types';
import { AlertTriangle, Lock, Play, Pause, Bookmark, ThumbsUp, Radio, Plus, Gauge, Volume2, VolumeX, Sliders, Zap } from 'lucide-react';

interface YouTubePlayerProps {
  playback: PlaybackState;
  myRole: Role;
  queue?: QueueItem[];
  onPlaybackChange: (action: 'play' | 'pause' | 'seek', targetTime?: number) => void;
  onConfirmChangeVideo: (videoIdOrUrl: string) => void;
  onAddToQueue: (videoId: string, title: string) => void;
  onRequestAction: (action: 'play' | 'pause') => void;
  onOpenSearchModal?: (initialQuery?: string) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  playback,
  myRole,
  queue = [],
  onPlaybackChange,
  onConfirmChangeVideo,
  onAddToQueue,
  onRequestAction,
  onOpenSearchModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isRemoteUpdateRef = useRef<boolean>(false);
  const isLocallyPausedRef = useRef<boolean>(false);

  const [isApiReady, setIsApiReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [newVideoInput, setNewVideoInput] = useState('');
  const [likesCount, setLikesCount] = useState(128);
  const [hasLiked, setHasLiked] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Participant Live Stream Horizon & Lagging Catch-Up State
  const [isLocallyPaused, setIsLocallyPaused] = useState(false);
  const [isLaggingCatchUp, setIsLaggingCatchUp] = useState(false);
  const [behindSeconds, setBehindSeconds] = useState<number>(0);
  const [hostPauseCeiling, setHostPauseCeiling] = useState<number | null>(null);

  // Video Quality, Speed & Audio Controls (Both Host & Participants)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [playbackQuality, setPlaybackQuality] = useState<string>('auto');
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const canControl = myRole === 'host' || myRole === 'moderator';

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };
  }, []);

  // Initialize YouTube Player Frame
  useEffect(() => {
    if (!isApiReady || !containerRef.current) return;

    if (playerRef.current) {
      playerRef.current.destroy();
    }

    setPlayerError(null);
    setIsLocallyPaused(false);
    isLocallyPausedRef.current = false;
    setIsLaggingCatchUp(false);

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: playback.videoId,
      playerVars: {
        autoplay: playback.isPlaying ? 1 : 0,
        controls: 1, // Enable native controls for all (speed, quality, volume)
        disablekb: 0,
        modestbranding: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          if (playback.isPlaying) {
            event.target.playVideo();
          } else {
            event.target.pauseVideo();
          }
          if (playback.currentTime > 0) {
            event.target.seekTo(playback.currentTime, true);
          }
          try {
            event.target.setPlaybackRate(playbackSpeed);
          } catch (e) {}
        },
        onStateChange: (event: any) => {
          if (isRemoteUpdateRef.current) return;

          if (event.data === window.YT.PlayerState.PAUSED) {
            if (canControl) {
              // Host or Moderator paused -> broadcast exact pause timestamp to room
              const currentTime = event.target.getCurrentTime();
              onPlaybackChange('pause', currentTime);
            } else {
              // Participant manually paused locally
              setIsLocallyPaused(true);
              isLocallyPausedRef.current = true;
            }
          } else if (event.data === window.YT.PlayerState.PLAYING) {
            if (canControl) {
              // Host or Moderator played -> broadcast to room
              const currentTime = event.target.getCurrentTime();
              onPlaybackChange('play', currentTime);
            } else {
              // Participant played -> enforce max live horizon limit
              const currentLocalTime = event.target.getCurrentTime();
              const currentMaxHorizon = calculateMaxWatchableHorizon();

              // Prevent participant from playing past host's max horizon
              if (currentLocalTime > currentMaxHorizon + 0.5) {
                isRemoteUpdateRef.current = true;
                event.target.seekTo(currentMaxHorizon, true);
                if (!playback.isPlaying) {
                  event.target.pauseVideo();
                }
                setTimeout(() => { isRemoteUpdateRef.current = false; }, 300);
                return;
              }

              if (isLocallyPausedRef.current) {
                setIsLocallyPaused(false);
                isLocallyPausedRef.current = false;
                syncPlayerWithState(true);
              }
            }
          }
        },
        onError: (event: any) => {
          console.error('[YouTube Player Error]', event.data);
          setPlayerError('Video unavailable or restricted from playback.');
        },
      },
    });

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isApiReady, playback.videoId]);

  // Sync state whenever server sends updated playback state
  useEffect(() => {
    syncPlayerWithState();
  }, [playback.videoId, playback.isPlaying, playback.currentTime, playback.lastUpdated]);

  // Helper to calculate maximum watchable timestamp (Live Edge Horizon)
  const calculateMaxWatchableHorizon = (): number => {
    if (!playback.isPlaying) {
      // Host is paused -> ceiling is exact host pause timestamp
      return playback.currentTime;
    }
    // Host is playing -> ceiling is current live edge
    const elapsed = (Date.now() - playback.lastUpdated) / 1000;
    return playback.currentTime + elapsed;
  };

  // High-precision ticker (every 200ms) to monitor lagging participants & enforce live horizon pause point
  useEffect(() => {
    const interval = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

      try {
        const localTime = playerRef.current.getCurrentTime();
        const maxHorizon = calculateMaxWatchableHorizon();

        // 1. HARD HORIZON ENFORCEMENT: Prevent fast-forwarding past host live position
        if (!canControl && localTime > maxHorizon + 0.8) {
          isRemoteUpdateRef.current = true;
          playerRef.current.seekTo(maxHorizon, true);
          if (!playback.isPlaying) {
            playerRef.current.pauseVideo();
          }
          setTimeout(() => { isRemoteUpdateRef.current = false; }, 300);
          return;
        }

        // 2. LIVE STREAM HOST PAUSE CATCH-UP LOGIC:
        // If Host is PAUSED, but Participant is lagging behind host's pause point:
        if (!canControl && !playback.isPlaying) {
          const pausePoint = playback.currentTime;

          if (localTime < pausePoint - 0.5) {
            // Participant is lagging behind host's pause point:
            // ALLOW them to keep playing until they reach pausePoint!
            setIsLaggingCatchUp(true);
            setHostPauseCeiling(pausePoint);
            setBehindSeconds(Math.round((pausePoint - localTime) * 10) / 10);

            // Ensure participant continues playing if not locally paused
            const state = playerRef.current.getPlayerState();
            if (!isLocallyPausedRef.current && state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING) {
              playerRef.current.playVideo();
            }
          } else {
            // Participant has reached or passed host's pause point -> AUTOMATICALLY PAUSE!
            setIsLaggingCatchUp(false);
            setHostPauseCeiling(pausePoint);
            setBehindSeconds(0);

            const state = playerRef.current.getPlayerState();
            if (state === window.YT.PlayerState.PLAYING) {
              isRemoteUpdateRef.current = true;
              playerRef.current.seekTo(pausePoint, true);
              playerRef.current.pauseVideo();
              setTimeout(() => { isRemoteUpdateRef.current = false; }, 300);
            }
          }
        } else {
          setIsLaggingCatchUp(false);
          setHostPauseCeiling(null);
        }
      } catch (err) {}
    }, 200);

    return () => clearInterval(interval);
  }, [playback.currentTime, playback.isPlaying, playback.lastUpdated, canControl]);

  const syncPlayerWithState = (forceSync = false) => {
    if (!playerRef.current || typeof playerRef.current.getPlayerState !== 'function') return;

    // IF HOST IS PAUSED:
    if (!playback.isPlaying) {
      const pausePoint = playback.currentTime;
      const localTime = playerRef.current.getCurrentTime();

      // If participant is already at or ahead of host pause point -> pause immediately
      if (localTime >= pausePoint - 0.5) {
        isRemoteUpdateRef.current = true;
        setIsLocallyPaused(false);
        isLocallyPausedRef.current = false;
        try {
          playerRef.current.seekTo(pausePoint, true);
          playerRef.current.pauseVideo();
        } catch (err) {}
        setTimeout(() => { isRemoteUpdateRef.current = false; }, 300);
      } else {
        // Participant is lagging behind -> allow them to keep playing until reaching pausePoint
        setIsLaggingCatchUp(true);
        setHostPauseCeiling(pausePoint);
      }
      return;
    }

    // IF HOST IS PLAYING:
    setIsLaggingCatchUp(false);
    setHostPauseCeiling(null);

    // If host is playing, but participant is locally paused (and not forcing catch-up), keep locally paused
    if (!canControl && isLocallyPausedRef.current && !forceSync) {
      return;
    }

    // Perform standard frame-lock synchronization
    isRemoteUpdateRef.current = true;

    try {
      const playerState = playerRef.current.getPlayerState();
      const localTime = playerRef.current.getCurrentTime();

      const expectedTime = calculateMaxWatchableHorizon();

      if (forceSync || Math.abs(localTime - expectedTime) > 1.5) {
        playerRef.current.seekTo(expectedTime, true);
      }

      if (playback.isPlaying && playerState !== window.YT.PlayerState.PLAYING) {
        playerRef.current.playVideo();
      }
    } catch (err) {
      console.error('[Sync Error]', err);
    } finally {
      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 500);
    }
  };

  const handleCatchUp = () => {
    setIsLocallyPaused(false);
    isLocallyPausedRef.current = false;
    setIsLaggingCatchUp(false);
    setBehindSeconds(0);
    syncPlayerWithState(true);
  };

  const handleToggleLocalPause = () => {
    if (isLocallyPaused) {
      handleCatchUp();
    } else {
      setIsLocallyPaused(true);
      isLocallyPausedRef.current = true;
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(speed);
    }
  };

  const handleQualityChange = (quality: string) => {
    setPlaybackQuality(quality);
    if (playerRef.current && typeof playerRef.current.setPlaybackQuality === 'function') {
      playerRef.current.setPlaybackQuality(quality);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (playerRef.current) {
      if (newVol === 0) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(newVol);
      }
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (playerRef.current) playerRef.current.unMute();
    } else {
      setIsMuted(true);
      if (playerRef.current) playerRef.current.mute();
    }
  };

  const isDirectYouTubeUrlOrId = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return false;
    if (trimmed.length === 11 && !trimmed.includes(' ') && !trimmed.includes('/')) return true;
    const match = trimmed.match(/(?:v=|\/embed\/|\/1\/|\/v\/|https:\/\/youtu\.be\/|\/watch\?v=)([^#&?]*)/);
    return !!(match && match[1] && match[1].length === 11);
  };

  const extractYouTubeId = (input: string) => {
    const trimmed = input.trim();
    const match = trimmed.match(/(?:v=|\/embed\/|\/1\/|\/v\/|https:\/\/youtu\.be\/|\/watch\?v=)([^#&?]*)/);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
    return trimmed;
  };

  const handleBroadcastNewVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newVideoInput.trim();
    if (!val) {
      if (onOpenSearchModal) onOpenSearchModal();
      return;
    }

    if (isDirectYouTubeUrlOrId(val)) {
      onConfirmChangeVideo(extractYouTubeId(val));
      setNewVideoInput('');
    } else {
      if (onOpenSearchModal) {
        onOpenSearchModal(val);
        setNewVideoInput('');
      } else {
        onConfirmChangeVideo(val);
        setNewVideoInput('');
      }
    }
  };

  const handleAddQueueSubmit = () => {
    const val = newVideoInput.trim();
    if (!val) {
      if (onOpenSearchModal) onOpenSearchModal();
      return;
    }

    if (isDirectYouTubeUrlOrId(val)) {
      onAddToQueue(extractYouTubeId(val), 'Queued YouTube Video');
      setNewVideoInput('');
    } else {
      if (onOpenSearchModal) {
        onOpenSearchModal(val);
        setNewVideoInput('');
      } else {
        onAddToQueue(val, 'Queued YouTube Video');
        setNewVideoInput('');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Main Player Frame Container */}
      <div className="sticky-mobile-player" style={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%',
        backgroundColor: '#000000',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
      }}>
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />

        {/* Sync & Live Stream Horizon Overlay */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: isLaggingCatchUp
            ? 'rgba(217, 119, 6, 0.95)'
            : isLocallyPaused
            ? 'rgba(220, 38, 38, 0.95)'
            : 'rgba(15, 23, 42, 0.85)',
          color: '#FFFFFF',
          padding: '0.4rem 0.85rem',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 10,
          backdropFilter: 'blur(4px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isLaggingCatchUp ? '#F59E0B' : isLocallyPaused ? '#FBBF24' : playback.isPlaying ? '#22C55E' : '#EF4444'
          }} />
          <span>
            {isLaggingCatchUp
              ? `Catching up to Host Pause Point (${behindSeconds}s left to ${hostPauseCeiling?.toFixed(1)}s)`
              : isLocallyPaused
              ? `Paused Locally (${behindSeconds}s behind Host)`
              : playback.isPlaying
              ? 'Live Stream Synced with Host'
              : `Paused at ${playback.currentTime.toFixed(1)}s by ${playback.updatedBy || 'Host'} (Live Edge Locked)`}
          </span>
        </div>

        {/* Live Stream Horizon Pill & Catch Up button */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 10,
        }}>
          {isLaggingCatchUp && (
            <span style={{
              backgroundColor: '#D97706',
              color: '#FFFFFF',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '0.35rem 0.75rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              <Zap size={14} className="animate-bounce" /> Playing until Host Pause ({hostPauseCeiling?.toFixed(1)}s)
            </span>
          )}

          <span style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: '#FFFFFF',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.25rem 0.6rem',
            borderRadius: '4px',
            backdropFilter: 'blur(4px)',
          }}>
            {playbackQuality.toUpperCase()} • {playbackSpeed}x • Live Edge
          </span>

          <button
            onClick={handleCatchUp}
            style={{
              backgroundColor: isLocallyPaused || isLaggingCatchUp ? '#DC2626' : 'rgba(15, 23, 42, 0.8)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Radio size={12} />
            Jump to Live Host
          </button>
        </div>

        {playerError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
            zIndex: 30,
          }}>
            <AlertTriangle size={48} color="#EF4444" />
            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{playerError}</div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
              Please check the YouTube URL or choose a different video using Host Controls.
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Playback Controls, Speed & Quality Resolution Options for Host & Participants */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        backgroundColor: canControl ? '#EFF6FF' : '#FFFFFF',
        border: canControl ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
        borderRadius: '0.75rem',
        padding: '0.85rem 1.25rem',
      }}>
        {/* Top Control Bar Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
          {canControl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => onPlaybackChange(playback.isPlaying ? 'pause' : 'play')}
                className="btn-primary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                {playback.isPlaying ? <Pause size={16} /> : <Play size={16} fill="#FFF" />}
                {playback.isPlaying ? 'Pause for Everyone' : 'Play for Everyone'}
              </button>
              <span style={{ fontSize: '0.85rem', color: '#1E40AF', fontWeight: 700 }}>
                Host Live Master Active — Host pause sets absolute watch ceiling for all.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleToggleLocalPause}
                className="btn-secondary"
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.85rem',
                  color: isLocallyPaused ? '#DC2626' : '#2563EB',
                  fontWeight: 700,
                  borderColor: isLocallyPaused ? '#FCA5A5' : '#BFDBFE',
                  backgroundColor: isLocallyPaused ? '#FEF2F2' : '#EFF6FF',
                }}
              >
                {isLocallyPaused ? <Play size={15} fill="#DC2626" /> : <Pause size={15} />}
                {isLocallyPaused ? 'Resume Local Playback' : 'Pause on My Screen Only'}
              </button>

              {isLaggingCatchUp ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  color: '#92400E',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.5rem',
                }}>
                  <Zap size={15} color="#D97706" />
                  <span>Playing to Host Pause Point ({behindSeconds}s remaining)</span>
                </div>
              ) : isLocallyPaused ? (
                <button
                  onClick={handleCatchUp}
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                >
                  <Zap size={14} /> Catch Up to Host Live Edge
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.85rem' }}>
                  <Lock size={15} color="#DC2626" />
                  <span>Live Stream Horizon Active — Cannot scrub past Host live position.</span>
                </div>
              )}

              <button
                onClick={() => onRequestAction('play')}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              >
                Request Host Play
              </button>

              <button
                onClick={() => onRequestAction('pause')}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              >
                Request Host Pause
              </button>
            </div>
          )}

          <button
            onClick={handleCatchUp}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', color: '#DC2626', fontWeight: 700 }}
          >
            <Radio size={14} /> Jump to Live Host
          </button>
        </div>

        {/* Bottom Control Bar Row: Playback Speed, Quality/Resolution, and Volume Controls (Host & Participants) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #E2E8F0',
          paddingTop: '0.65rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          {/* Playback Speed Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
            <Gauge size={15} color="#DC2626" />
            <span style={{ fontWeight: 700 }}>Speed:</span>
            <div style={{ display: 'flex', gap: '0.2rem' }}>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  style={{
                    border: '1px solid #CBD5E1',
                    borderRadius: '0.375rem',
                    padding: '0.15rem 0.45rem',
                    fontSize: '0.75rem',
                    fontWeight: playbackSpeed === spd ? 800 : 500,
                    cursor: 'pointer',
                    backgroundColor: playbackSpeed === spd ? '#DC2626' : '#FFFFFF',
                    color: playbackSpeed === spd ? '#FFFFFF' : '#475569',
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Quality / Resolution Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
            <Sliders size={15} color="#2563EB" />
            <span style={{ fontWeight: 700 }}>Quality:</span>
            <select
              value={playbackQuality}
              onChange={(e) => handleQualityChange(e.target.value)}
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #CBD5E1',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="auto">Auto (Adaptive HD)</option>
              <option value="hd1080">1080p Full HD</option>
              <option value="hd720">720p HD</option>
              <option value="large">480p SD</option>
              <option value="medium">360p Low</option>
              <option value="small">240p Saver</option>
            </select>
          </div>

          {/* Volume Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
            <button
              onClick={handleToggleMute}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: isMuted ? '#DC2626' : '#475569', display: 'flex', alignItems: 'center' }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              style={{ width: '80px', accentColor: '#DC2626', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748B', width: '28px' }}>
              {isMuted ? 'Muted' : `${volume}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Video Metadata & Synchronized Description Card */}
      <div className="video-metadata-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                NOW PLAYING
              </span>
              <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 700 }}>
                {playback.channelTitle ? `Channel: ${playback.channelTitle}` : '• YouTube Stream'}
              </span>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: '#0F172A' }}>
              {playback.title || 'How to Build Better Products — Full Talk'}
            </h2>
          </div>

          {/* Like & Bookmark action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                setHasLiked(!hasLiked);
                setLikesCount(prev => hasLiked ? prev - 1 : prev + 1);
              }}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', color: hasLiked ? '#DC2626' : '#475569' }}
            >
              <ThumbsUp size={14} fill={hasLiked ? '#DC2626' : 'none'} />
              {likesCount}
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
              <Bookmark size={14} />
            </button>
          </div>
        </div>

        {/* Synchronized Video Description */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #F1F5F9',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.85rem',
          color: '#475569',
          lineHeight: 1.5,
          width: '100%',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            VIDEO DESCRIPTION
          </div>
          <div style={{
            display: '-webkit-box',
            WebkitLineClamp: showFullDesc ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {playback.description || 'Welcome to the watch party! Real-time frame synchronization is active across all connected room viewers.'}
          </div>
          <button
            onClick={() => setShowFullDesc(!showFullDesc)}
            style={{ border: 'none', background: 'none', color: '#DC2626', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginTop: '0.35rem' }}
          >
            {showFullDesc ? 'Show Less' : 'Read Full Description'}
          </button>
        </div>
      </div>

      {/* Broadcast / Load New Video Bar with Direct YouTube Search */}
      {canControl && (
        <form onSubmit={handleBroadcastNewVideo} className="video-action-form">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DC2626', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            <Radio size={16} />
            Change Video
          </div>

          <input
            type="text"
            value={newVideoInput}
            onChange={(e) => setNewVideoInput(e.target.value)}
            placeholder="Search YouTube or paste video link/ID..."
            style={{
              flex: 1,
              padding: '0.5rem 0.85rem',
              borderRadius: '0.5rem',
              border: '1px solid #CBD5E1',
              fontSize: '0.85rem',
              outline: 'none',
              width: '100%',
            }}
          />

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {onOpenSearchModal && (
              <button
                type="button"
                onClick={() => onOpenSearchModal(newVideoInput.trim())}
                className="btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', color: '#2563EB', fontWeight: 700 }}
              >
                🔍 Search YouTube
              </button>
            )}

            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              Broadcast Now
            </button>

            <button type="button" onClick={handleAddQueueSubmit} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              <Plus size={14} /> Add Queue
            </button>
          </div>
        </form>
      )}

      {/* Up Next in Room Queue */}
      {queue.length > 0 && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '0.75rem',
          padding: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Up Next in Room Queue
              </h3>
              <span style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                {queue.length} remaining
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700, cursor: 'pointer' }}>
              + Add from Playlists
            </span>
          </div>

          {/* Queue Items Row */}
          <div className="responsive-queue-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {queue.map((item) => (
              <div
                key={item.id}
                onClick={() => canControl && onConfirmChangeVideo(item.videoId)}
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  cursor: canControl ? 'pointer' : 'default',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.8)', color: '#FFF', fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>
                    10:15
                  </span>
                </div>
                <div style={{ padding: '0.5rem 0.65rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.15rem' }}>
                    Queued by {item.addedBy}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
