import React from 'react';
import type { ActionRequest } from '../types';
import { Bell, Check, X } from 'lucide-react';

interface ActionRequestsBannerProps {
  pendingRequests: ActionRequest[];
  onResolveRequest: (requestId: string, status: 'approved' | 'rejected') => void;
}

export const ActionRequestsBanner: React.FC<ActionRequestsBannerProps> = ({
  pendingRequests,
  onResolveRequest,
}) => {
  if (pendingRequests.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#FEF2F2',
      border: '1px solid #FECACA',
      borderRadius: '0.75rem',
      padding: '0.75rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991B1B', fontWeight: 700, fontSize: '0.85rem' }}>
        <Bell size={16} />
        <span>Pending Participant Action Requests ({pendingRequests.length})</span>
      </div>

      {pendingRequests.map((req) => (
        <div
          key={req.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            border: '1px solid #FCA5A5',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <strong style={{ color: '#0F172A' }}>{req.username}</strong> requested:{' '}
            <span style={{ color: '#DC2626', fontWeight: 600 }}>
              {req.actionType === 'change_video'
                ? `Change Video (${req.payload?.videoId || 'URL'})`
                : req.actionType === 'play'
                ? 'Play Video'
                : 'Pause Video'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => onResolveRequest(req.id, 'approved')}
              style={{
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <Check size={14} /> Approve
            </button>

            <button
              onClick={() => onResolveRequest(req.id, 'rejected')}
              style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <X size={14} /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
