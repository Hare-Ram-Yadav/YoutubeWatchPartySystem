import React, { useState } from 'react';
import { User, X, Check, ShieldCheck, Crown, Clock, Award } from 'lucide-react';
import type { Role } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  myRole?: Role;
  onUpdateUsername: (newUsername: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  username,
  myRole = 'participant',
  onUpdateUsername,
}) => {
  const [nameInput, setNameInput] = useState(username);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onUpdateUsername(nameInput.trim());
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
        maxWidth: '480px',
        width: '100%',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <User size={20} color="#DC2626" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              User Profile & Identity
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        {/* Profile Details Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Avatar Card Banner */}
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '1.4rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(220,38,38,0.3)',
            }}>
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </div>

            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                {username || 'Guest User'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                <span style={{
                  backgroundColor: myRole === 'host' ? '#FEE2E2' : '#DBEAFE',
                  color: myRole === 'host' ? '#991B1B' : '#1E40AF',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.5rem',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}>
                  {myRole === 'host' ? <Crown size={12} /> : <ShieldCheck size={12} />}
                  {myRole} Role
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  ID: {userId ? `${userId.substring(0, 10)}...` : 'usr_session'}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Display Name input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              Change Display Name
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
              placeholder="e.g. Alex Johnson"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.5rem',
                border: '1px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.3rem', display: 'block' }}>
              Your display name is visible to everyone in watch rooms and chat.
            </span>
          </div>

          {/* User Stats Card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            paddingTop: '0.5rem',
          }}>
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.75rem', fontWeight: 700 }}>
                <Clock size={14} color="#DC2626" /> SESSIONS WATCHED
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A', marginTop: '0.2rem' }}>
                12 Sessions
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.5rem', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.75rem', fontWeight: 700 }}>
                <Award size={14} color="#16A34A" /> ACCOUNT STATUS
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#16A34A', marginTop: '0.2rem' }}>
                Verified Streamer
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>
              {isSaved ? <Check size={16} /> : null}
              {isSaved ? 'Updated!' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
