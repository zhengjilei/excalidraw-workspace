import { useState } from 'react';

interface Props {
  onClose: () => void;
  onCreate: (name: string) => void;
}

export default function CreateWorkspaceModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('');

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 16px' }}>Create Workspace</h2>
        <input
          autoFocus
          style={input}
          placeholder="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onCreate(name.trim())}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button style={btnSecondary} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} disabled={!name.trim()} onClick={() => onCreate(name.trim())}>Create</button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modal: React.CSSProperties = {
  background: '#2a2a2a', borderRadius: 8, padding: 24, minWidth: 360, color: '#eee',
};
const input: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #555',
  background: '#1a1a1a', color: '#eee', fontSize: 14, boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 4, border: 'none', background: '#6965db',
  color: '#fff', cursor: 'pointer', fontSize: 14,
};
const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 4, border: '1px solid #555', background: 'transparent',
  color: '#ccc', cursor: 'pointer', fontSize: 14,
};
