import { useEffect, useState } from 'react';
import type { Workspace } from '../api/types';
import { listWorkspaces } from '../api/client';

interface Props {
  currentWorkspaceId: string;
  action: 'move' | 'copy';
  onSelect: (targetWid: string) => void;
  onClose: () => void;
}

export default function WorkspacePickerModal({ currentWorkspaceId, action, onSelect, onClose }: Props) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    listWorkspaces().then((ws) => setWorkspaces(ws.filter((w) => w.id !== currentWorkspaceId)));
  }, [currentWorkspaceId]);

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 16px' }}>{action === 'move' ? 'Move to...' : 'Copy to...'}</h2>
        {workspaces.length === 0 ? (
          <p style={{ color: '#999' }}>No other workspaces available.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {workspaces.map((ws) => (
              <button key={ws.id} style={wsBtn} onClick={() => onSelect(ws.id)}>
                {ws.name}
              </button>
            ))}
          </div>
        )}
        <button style={cancelBtn} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modal: React.CSSProperties = {
  background: '#2a2a2a', borderRadius: 8, padding: 24, minWidth: 320, color: '#eee',
};
const wsBtn: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 4, border: '1px solid #444',
  background: '#1a1a1a', color: '#eee', cursor: 'pointer', fontSize: 14, textAlign: 'left',
};
const cancelBtn: React.CSSProperties = {
  marginTop: 16, padding: '8px 16px', borderRadius: 4, border: '1px solid #555',
  background: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: 14, width: '100%',
};
