import React, { useState } from 'react';
import { Video, X, AlertCircle } from 'lucide-react';

interface ChangeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmChangeVideo: (videoUrlOrId: string) => void;
  isParticipant?: boolean;
}

export const ChangeVideoModal: React.FC<ChangeVideoModalProps> = ({
  isOpen,
  onClose,
  onConfirmChangeVideo,
  isParticipant = false,
}) => {
  const [videoInput, setVideoInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoInput.trim()) return;
    onConfirmChangeVideo(videoInput.trim());
    setVideoInput('');
    onClose();
  };

  // Helper to extract YouTube video ID for thumbnail preview
  let previewVideoId = '';
  if (videoInput) {
    const match = videoInput.match(/(?:v=|\/embed\/|\/1\/|\/v\/|https:\/\/youtu\.be\/|\/watch\?v=)([^#&?]*)/);
    if (match && match[1].length === 11) {
      previewVideoId = match[1];
    } else if (videoInput.length === 11) {
      previewVideoId = videoInput;
    }
  }

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
        padding: '1.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Video size={18} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
              {isParticipant ? 'Request Video Change' : 'Change Video'}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              YouTube Video URL or ID
            </label>
            <input
              type="text"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.5rem',
                border: '1px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Thumbnail Live Preview */}
          {previewVideoId && (
            <div style={{
              borderRadius: '0.5rem',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
              backgroundColor: '#000000',
              position: 'relative',
              paddingTop: '56.25%',
            }}>
              <img
                src={`https://img.youtube.com/vi/${previewVideoId}/mqdefault.jpg`}
                alt="Video Preview"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}

          {/* Notice Banner */}
          <div style={{
            backgroundColor: isParticipant ? '#EFF6FF' : '#FEF2F2',
            border: isParticipant ? '1px solid #BFDBFE' : '1px solid #FCA5A5',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            fontSize: '0.8rem',
            color: isParticipant ? '#1E40AF' : '#991B1B',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              {isParticipant ? (
                <span>Submitting this request will alert the Host/Moderators for approval.</span>
              ) : (
                <span>Changing the video will update playback for all participants in this room immediately.</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isParticipant ? 'Submit Request' : 'Change Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
