import React, { useState, useEffect } from 'react';
import { Settings, Save, X, Moon, Sun, Check } from 'lucide-react';
import type { UserPreferences } from '../types';
import { getBackendUrl } from '../services/socket';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSavePreferences: (prefs: UserPreferences) => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  userId,
  onSavePreferences,
}) => {
  const [autoplay, setAutoplay] = useState(true);
  const [syncThreshold, setSyncThreshold] = useState(1.5);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [notifications, setNotifications] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load existing preferences from backend or localStorage
    const SERVER_URL = getBackendUrl();
    fetch(`${SERVER_URL}/api/preferences/${userId || 'default_user'}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.preferences) {
          setAutoplay(Boolean(data.preferences.autoplay));
          setSyncThreshold(data.preferences.syncThreshold || 1.5);
          setTheme(data.preferences.theme || 'light');
          setNotifications(Boolean(data.preferences.notifications));
        }
      })
      .catch((err) => {
        console.warn('Load preferences error, loading local fallback:', err);
        const saved = localStorage.getItem('user_prefs');
        if (saved) {
          const parsed = JSON.parse(saved);
          setAutoplay(parsed.autoplay ?? true);
          setSyncThreshold(parsed.syncThreshold ?? 1.5);
          setTheme(parsed.theme || 'light');
          setNotifications(parsed.notifications ?? true);
        }
      });
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prefs: UserPreferences = {
      userId: userId || 'default_user',
      autoplay,
      syncThreshold,
      theme,
      notifications,
    };

    // Save locally
    localStorage.setItem('user_prefs', JSON.stringify(prefs));
    onSavePreferences(prefs);

    // Save to server
    try {
      const SERVER_URL = getBackendUrl();
      await fetch(`${SERVER_URL}/api/preferences/${userId || 'default_user'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
    } catch (err) {
      console.error('Save preferences API error:', err);
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
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
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Settings size={20} color="#DC2626" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              User Preferences
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Autoplay setting */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                Autoplay Next Queue Video
              </label>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Automatically play the next video when current video ends.
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => setAutoplay(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#DC2626', cursor: 'pointer' }}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: 0 }} />

          {/* Sync Threshold setting */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                Auto-Sync Drift Tolerance
              </label>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#DC2626' }}>
                {syncThreshold} seconds
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '0.5rem' }}>
              Player will auto-correct if viewer playback drifts past this threshold.
            </span>
            <select
              value={syncThreshold}
              onChange={(e) => setSyncThreshold(parseFloat(e.target.value))}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            >
              <option value={0.5}>0.5 seconds (Strict Micro-Sync)</option>
              <option value={1.0}>1.0 second (Recommended Standard)</option>
              <option value={1.5}>1.5 seconds (Default Balanced)</option>
              <option value={2.0}>2.0 seconds (High Latency Tolerant)</option>
            </select>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: 0 }} />

          {/* Notifications setting */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                Chat & Request Notifications
              </label>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Receive visual alerts for participant requests and room events.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#DC2626', cursor: 'pointer' }}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: 0 }} />

          {/* Theme setting */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#0F172A', marginBottom: '0.35rem' }}>
              Visual Theme Preference
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setTheme('light')}
                style={{
                  padding: '0.6rem',
                  borderRadius: '0.5rem',
                  border: theme === 'light' ? '2px solid #DC2626' : '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <Sun size={14} color="#DC2626" /> Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                style={{
                  padding: '0.6rem',
                  borderRadius: '0.5rem',
                  border: theme === 'dark' ? '2px solid #DC2626' : '1px solid #CBD5E1',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <Moon size={14} color="#F59E0B" /> Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                style={{
                  padding: '0.6rem',
                  borderRadius: '0.5rem',
                  border: theme === 'system' ? '2px solid #DC2626' : '1px solid #CBD5E1',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                System
              </button>
            </div>
          </div>

          {/* Footer Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>
              {isSaved ? <Check size={16} /> : <Save size={16} />}
              {isSaved ? 'Saved!' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
