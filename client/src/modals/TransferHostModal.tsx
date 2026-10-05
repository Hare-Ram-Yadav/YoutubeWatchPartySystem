import React from 'react';
import { Crown, X, ArrowRight, ShieldAlert } from 'lucide-react';

interface TransferHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUsername: string;
  currentHostName: string;
  onConfirmTransfer: (newHostUserId: string) => void;
}

export const TransferHostModal: React.FC<TransferHostModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUsername,
  currentHostName,
  onConfirmTransfer,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirmTransfer(targetUserId);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
        width: '100%',
        maxWidth: '520px',
        padding: '1.75rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Crown size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Transfer Host?
                </h2>
                <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                  IRREVERSIBLE
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                You're about to transfer Host control to <strong>{targetUsername}</strong>.
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Handoff Preview Cards (Matching Screenshot) */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.25rem',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            OWNERSHIP HANDOFF PREVIEW
          </span>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', gap: '0.5rem' }}>
            {/* Current Host */}
            <div style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
              }}>
                {currentHostName.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Current Host</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{currentHostName}</span>
                <span style={{ fontSize: '0.7rem', color: '#2563EB' }}>Promoted to Moderator</span>
              </div>
            </div>

            <ArrowRight size={20} color="#94A3B8" />

            {/* New Host */}
            <div style={{
              flex: 1,
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
              }}>
                {targetUsername.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 700 }}>New Room Host</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{targetUsername}</span>
                <span style={{ fontSize: '0.7rem', color: '#16A34A' }}>Promoted to Host</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ownership Notice */}
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '0.75rem',
          padding: '0.85rem',
          display: 'flex',
          gap: '0.6rem',
          fontSize: '0.8rem',
          color: '#991B1B',
          marginBottom: '1.5rem',
        }}>
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <strong>Room Ownership Notice:</strong> {targetUsername} will gain absolute control over stream synchronization, participant removals, role assignments, and playback settings.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className="btn-primary">
            <Crown size={16} />
            Transfer Host
          </button>
        </div>
      </div>
    </div>
  );
};
