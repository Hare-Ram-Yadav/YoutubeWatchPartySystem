import React, { useState, useEffect, useCallback } from 'react';
import { Search, Play, Plus, X, Radio, Loader2 } from 'lucide-react';
import type { YouTubeSearchResult } from '../types';

import { getBackendUrl } from '../services/socket';

interface YouTubeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBroadcastVideo: (result: YouTubeSearchResult) => void;
  onAddToQueue: (videoId: string, title: string) => void;
  isParticipant?: boolean;
  onRequestVideo?: (result: YouTubeSearchResult) => void;
  initialQuery?: string;
}

export const YouTubeSearchModal: React.FC<YouTubeSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectBroadcastVideo,
  onAddToQueue,
  isParticipant = false,
  onRequestVideo,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const SERVER_URL = getBackendUrl();
      const res = await fetch(`${SERVER_URL}/api/youtube/search?q=${encodeURIComponent(searchTerm.trim())}`);
      const data = await res.json();

      if (data.results && Array.isArray(data.results)) {
        setResults(data.results);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Unable to fetch YouTube results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const trimmed = (initialQuery || '').trim();
      setQuery(trimmed);
      if (trimmed) {
        performSearch(trimmed);
      } else {
        setResults([]);
        setHasSearched(false);
        setError(null);
      }
    }
  }, [isOpen, initialQuery, performSearch]);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    performSearch(query.trim());
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        maxWidth: '720px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              DIRECT YOUTUBE DISCOVERY
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Search & Select Video
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '0.4rem',
              borderRadius: '0.375rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="search-modal-form" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search YouTube videos, topics, or paste YouTube URL..."
              autoFocus
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }} disabled={isLoading}>
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </form>

        {/* Results Scroll Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
              <div>Searching YouTube database...</div>
            </div>
          )}

          {!isLoading && error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {!isLoading && !hasSearched && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748B' }}>
              <Radio size={36} color="#DC2626" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', marginBottom: '0.25rem' }}>
                Search millions of YouTube videos directly
              </div>
              <div style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
                Type keywords like "ambient music", "tech keynote", "nature 4K", or paste a YouTube URL above.
              </div>
            </div>
          )}

          {!isLoading && hasSearched && results.length === 0 && !error && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>No YouTube videos found</div>
              <div style={{ fontSize: '0.85rem' }}>Try refining your search terms or keywords.</div>
            </div>
          )}

          {!isLoading && results.map((video) => (
            <div
              key={video.videoId}
              style={{
                display: 'flex',
                gap: '1rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '0.75rem',
                padding: '0.85rem',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Thumbnail */}
              <div style={{ position: 'relative', width: '140px', height: '80px', flexShrink: 0, borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: '#000' }}>
                <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {video.duration && (
                  <span style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: '#FFF',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.35rem',
                    borderRadius: '3px',
                  }}>
                    {video.duration}
                  </span>
                )}
              </div>

              {/* Info & Description */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#0F172A', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {video.title}
                  </h4>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', marginBottom: '0.35rem' }}>
                    {video.channelTitle}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {video.description}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {!isParticipant ? (
                    <>
                      <button
                        onClick={() => {
                          onSelectBroadcastVideo(video);
                          onClose();
                        }}
                        className="btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        <Play size={14} fill="#FFF" /> Broadcast Now
                      </button>
                      <button
                        onClick={() => {
                          onAddToQueue(video.videoId, video.title);
                        }}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        <Plus size={14} /> Add Queue
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        if (onRequestVideo) onRequestVideo(video);
                        onClose();
                      }}
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#DC2626' }}
                    >
                      <Radio size={14} /> Request Video to Host
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
