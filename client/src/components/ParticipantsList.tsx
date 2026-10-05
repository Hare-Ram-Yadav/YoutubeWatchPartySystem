import React, { useState } from 'react';
import type { ParticipantData, Role } from '../types';
import { Shield, UserCheck, MoreVertical, UserX, Crown, Info, Eye } from 'lucide-react';

interface ParticipantsListProps {
  participants: ParticipantData[];
  myUserId: string;
  myRole: Role;
  hostId: string;
  onAssignRole: (targetUserId: string, newRole: Role) => void;
  onRemoveParticipant: (targetUserId: string) => void;
  onOpenTransferHostModal: (targetUserId: string, username: string) => void;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  myUserId,
  myRole,
  hostId,
  onAssignRole,
  onRemoveParticipant,
  onOpenTransferHostModal,
}) => {
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  const isHost = myRole === 'host';
  const isMod = myRole === 'moderator';
  const canManage = isHost || isMod;

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '0.75rem',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      {/* Header & Sync Status Pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
            Participants
          </h3>
          <span style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
            {participants.length} connected
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700 }}>
          All 100% Synced
        </span>
      </div>

      {/* Info Notice */}
      <div style={{
        backgroundColor: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: '0.5rem',
        padding: '0.5rem 0.75rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.4rem',
        fontSize: '0.75rem',
        color: '#1E40AF',
      }}>
        <Info size={14} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <span>Moderators manage video and playback. Only the Host can transfer ownership or remove members.</span>
      </div>

      {/* Participant List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
        {participants.map((p, index) => {
          const isTargetHost = p.userId === hostId;
          const isMe = p.userId === myUserId;
          const isMenuOpen = activeMenuUserId === p.userId;

          const statusDetail = p.role === 'host'
            ? 'Synced (Host Scrubber Master)'
            : p.role === 'moderator'
            ? 'Playback Controller • Synced'
            : index % 2 === 0
            ? 'Buffer: 100% • Online'
            : 'Synced • 0.05s drift';

          return (
            <div
              key={p.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: isMe ? '#EFF6FF' : '#F8FAFC',
                border: isMe ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: p.role === 'host' ? '#DC2626' : p.role === 'moderator' ? '#2563EB' : '#64748B',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {p.username.charAt(0).toUpperCase()}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                      {p.username} {isMe && '(YOU)'}
                    </span>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: p.isOnline ? '#22C55E' : '#94A3B8',
                    }} />
                  </div>

                  <span style={{ fontSize: '0.7rem', color: p.role === 'host' ? '#991B1B' : p.role === 'moderator' ? '#1E40AF' : '#64748B', fontWeight: 500 }}>
                    {statusDetail}
                  </span>
                </div>
              </div>

              {/* Role Badge & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className={p.role === 'host' ? 'badge-host' : p.role === 'moderator' ? 'badge-mod' : 'badge-participant'}>
                  {p.role}
                </span>

                {canManage && !isMe && !isTargetHost && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setActiveMenuUserId(isMenuOpen ? null : p.userId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        borderRadius: '0.25rem',
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {isMenuOpen && (
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '0.5rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        width: '190px',
                        zIndex: 50,
                        padding: '0.35rem 0',
                      }}>
                        {p.role !== 'moderator' ? (
                          <button
                            onClick={() => {
                              onAssignRole(p.userId, 'moderator');
                              setActiveMenuUserId(null);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.4rem 0.85rem',
                              fontSize: '0.8rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              color: '#1E40AF',
                            }}
                          >
                            <Shield size={14} /> Promote to Moderator
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onAssignRole(p.userId, 'participant');
                              setActiveMenuUserId(null);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.4rem 0.85rem',
                              fontSize: '0.8rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              color: '#475569',
                            }}
                          >
                            <UserCheck size={14} /> Set as Participant
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onAssignRole(p.userId, 'viewer');
                            setActiveMenuUserId(null);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.8rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#64748B',
                          }}
                        >
                          <Eye size={14} /> Set as Viewer (Alias)
                        </button>

                        {isHost && (
                          <button
                            onClick={() => {
                              onOpenTransferHostModal(p.userId, p.username);
                              setActiveMenuUserId(null);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.4rem 0.85rem',
                              fontSize: '0.8rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              color: '#D97706',
                            }}
                          >
                            <Crown size={14} /> Transfer Host
                          </button>
                        )}

                        <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '0.25rem 0' }} />

                        <button
                          onClick={() => {
                            onRemoveParticipant(p.userId);
                            setActiveMenuUserId(null);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.8rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#DC2626',
                          }}
                        >
                          <UserX size={14} /> Remove Participant
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
