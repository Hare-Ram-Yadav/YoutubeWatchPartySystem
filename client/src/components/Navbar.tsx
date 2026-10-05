import React, { useState } from 'react';
import { Tv, Share2, Plus, Users, Check, Menu, X, Search } from 'lucide-react';
import type { Role } from '../types';

interface NavbarProps {
  roomName?: string;
  roomId?: string;
  myRole?: Role;
  username?: string;
  participantCount?: number;
  activeTab?: 'watch' | 'explore' | 'preferences';
  onNavigateTab?: (tab: 'watch' | 'explore' | 'preferences') => void;
  onOpenCreateRoom: () => void;
  onLeaveRoom: () => void;
  onOpenPreferences: () => void;
  onOpenSearchModal: () => void;
  onOpenProfileModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomName,
  roomId,
  myRole,
  username,
  participantCount = 0,
  activeTab = 'watch',
  onNavigateTab,
  onOpenCreateRoom,
  onLeaveRoom,
  onOpenPreferences,
  onOpenSearchModal,
  onOpenProfileModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCopyLink = () => {
    if (!roomId) return;
    const url = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Left: Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            onClick={() => onNavigateTab ? onNavigateTab('watch') : (window.location.href = '/')}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Tv size={18} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#0F172A' }}>
              WatchParty
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="desktop-only-nav" style={{ gap: '1.25rem' }}>
            <span
              onClick={() => onNavigateTab && onNavigateTab('watch')}
              style={{
                fontWeight: 700,
                fontSize: '0.9rem',
                color: activeTab === 'watch' ? '#DC2626' : '#64748B',
                cursor: 'pointer',
                borderBottom: activeTab === 'watch' ? '2px solid #DC2626' : 'none',
                paddingBottom: '0.2rem',
              }}
            >
              Watch Room
            </span>
            <span
              onClick={() => onNavigateTab && onNavigateTab('explore')}
              style={{
                fontWeight: 700,
                fontSize: '0.9rem',
                color: activeTab === 'explore' ? '#DC2626' : '#64748B',
                cursor: 'pointer',
                borderBottom: activeTab === 'explore' ? '2px solid #DC2626' : 'none',
                paddingBottom: '0.2rem',
              }}
            >
              Explore
            </span>
            <span
              onClick={onOpenPreferences}
              style={{
                fontWeight: 700,
                fontSize: '0.9rem',
                color: '#64748B',
                cursor: 'pointer',
                paddingBottom: '0.2rem',
              }}
            >
              Preferences
            </span>
          </nav>
        </div>

        {/* Middle: Active Room Badge */}
        {roomId && (
          <div className="desktop-only-nav" style={{
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '9999px',
            padding: '0.25rem 0.85rem',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }}></span>
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1E40AF', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {roomName || 'Watch Room'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              [{roomId}]
            </span>
          </div>
        )}

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={onOpenSearchModal}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', color: '#2563EB', fontWeight: 700 }}
          >
            <Search size={15} />
            <span className="desktop-only-text">Search</span>
          </button>

          {roomId ? (
            <div className="desktop-only-nav" style={{ gap: '0.5rem' }}>
              <button
                onClick={handleCopyLink}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
              >
                {copied ? <Check size={15} color="#16A34A" /> : <Share2 size={15} />}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem',
                color: '#475569',
                backgroundColor: '#F1F5F9',
                padding: '0.3rem 0.6rem',
                borderRadius: '0.5rem',
              }}>
                <Users size={14} />
                <span>{participantCount}</span>
              </div>

              <button
                onClick={onLeaveRoom}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #CBD5E1',
                  borderRadius: '0.5rem',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  color: '#64748B',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Leave
              </button>
            </div>
          ) : (
            <button onClick={onOpenCreateRoom} className="btn-primary desktop-only-nav" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              <Plus size={16} />
              Create Room
            </button>
          )}

          {/* User Profile Avatar */}
          <div
            onClick={onOpenProfileModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              paddingLeft: '0.4rem',
              borderLeft: '1px solid #E2E8F0',
              cursor: 'pointer',
            }}
            title="Click to view & edit user profile"
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: myRole === 'host' ? '#DC2626' : myRole === 'moderator' ? '#2563EB' : '#475569',
              color: '#FFFFFF',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
            }}>
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.4rem',
              cursor: 'pointer',
              color: '#334155',
              display: 'none',
            }}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {isMobileMenuOpen && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        }}>
          {roomId && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#EFF6FF',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              color: '#1E40AF',
              fontWeight: 700,
            }}>
              <span>{roomName || 'Watch Room'} [{roomId}]</span>
              <span style={{ fontSize: '0.75rem', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>
                {participantCount} online
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('watch');
                setIsMobileMenuOpen(false);
              }}
              style={{
                textAlign: 'left',
                padding: '0.6rem 0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: activeTab === 'watch' ? '#FEE2E2' : '#F8FAFC',
                color: activeTab === 'watch' ? '#DC2626' : '#0F172A',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              📺 Watch Room
            </button>

            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('explore');
                setIsMobileMenuOpen(false);
              }}
              style={{
                textAlign: 'left',
                padding: '0.6rem 0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: activeTab === 'explore' ? '#FEE2E2' : '#F8FAFC',
                color: activeTab === 'explore' ? '#DC2626' : '#0F172A',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              🧭 Explore Videos & Public Rooms
            </button>

            <button
              onClick={() => {
                onOpenPreferences();
                setIsMobileMenuOpen(false);
              }}
              style={{
                textAlign: 'left',
                padding: '0.6rem 0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: '#F8FAFC',
                color: '#0F172A',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              ⚙️ Room Preferences
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
            {roomId ? (
              <>
                <button
                  onClick={() => {
                    handleCopyLink();
                    setIsMobileMenuOpen(false);
                  }}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }}
                >
                  <Share2 size={16} />
                  {copied ? 'Copied!' : 'Share Room'}
                </button>

                <button
                  onClick={() => {
                    onLeaveRoom();
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#991B1B',
                    borderRadius: '0.5rem',
                    padding: '0.6rem 1rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  Leave
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onOpenCreateRoom();
                  setIsMobileMenuOpen(false);
                }}
                className="btn-primary"
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', justifyContent: 'center' }}
              >
                <Plus size={18} />
                Create New Watch Room
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
