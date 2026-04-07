import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Workspace } from '../api/types';

interface Props {
  workspace: Workspace;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function WorkspaceCard({ workspace, onRename, onDelete }: Props) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(workspace.name);

  const handleRename = () => {
    if (name.trim() && name.trim() !== workspace.name) {
      onRename(workspace.id, name.trim());
    }
    setEditing(false);
  };

  return (
    <div style={card} onClick={() => !editing && navigate(`/workspace/${workspace.id}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {editing ? (
          <input
            autoFocus
            style={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false); }}
            onBlur={handleRename}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 style={{ margin: 0, fontSize: 16 }}>{workspace.name}</h3>
        )}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 13, color: '#999' }}>
        {workspace.file_count} file{workspace.file_count !== 1 ? 's' : ''} &middot; {new Date(workspace.updated_at).toLocaleDateString()}
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button style={actionBtn} onClick={(e) => { e.stopPropagation(); setEditing(true); }}>Rename</button>
        <button style={{ ...actionBtn, color: '#e55' }} onClick={(e) => {
          e.stopPropagation();
          if (confirm(`Delete "${workspace.name}"?`)) onDelete(workspace.id);
        }}>Delete</button>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#2a2a2a', borderRadius: 8, padding: 16, cursor: 'pointer',
  border: '1px solid #333', transition: 'border-color 0.2s',
};
const input: React.CSSProperties = {
  padding: '4px 8px', borderRadius: 4, border: '1px solid #555',
  background: '#1a1a1a', color: '#eee', fontSize: 16, width: '100%',
};
const actionBtn: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 4, border: '1px solid #444',
  background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: 12,
};
