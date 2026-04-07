import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExcalidrawFile } from '../api/types';
import { copyFile, moveFile } from '../api/client';
import WorkspacePickerModal from './WorkspacePickerModal';

interface Props {
  file: ExcalidrawFile;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onRefresh?: () => void;
}

export default function FileCard({ file, onRename, onDelete, onRefresh }: Props) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(file.name);
  const [pickerAction, setPickerAction] = useState<'move' | 'copy' | null>(null);

  const handleRename = () => {
    if (name.trim() && name.trim() !== file.name) {
      onRename(file.id, name.trim());
    }
    setEditing(false);
  };

  const handlePickerSelect = async (targetWid: string) => {
    if (pickerAction === 'copy') {
      await copyFile(file.workspace_id, file.id, targetWid);
    } else {
      await moveFile(file.workspace_id, file.id, targetWid);
    }
    setPickerAction(null);
    onRefresh?.();
  };

  return (
    <>
      <div style={card} onClick={() => !editing && navigate(`/workspace/${file.workspace_id}/file/${file.id}`)}>
        <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>&#9998;</div>
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
          <h3 style={{ margin: 0, fontSize: 14, textAlign: 'center', wordBreak: 'break-word' }}>{file.name}</h3>
        )}
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#999', textAlign: 'center' }}>
          {new Date(file.updated_at).toLocaleDateString()}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={actionBtn} onClick={(e) => { e.stopPropagation(); setEditing(true); }}>Rename</button>
          <button style={actionBtn} onClick={(e) => { e.stopPropagation(); setPickerAction('copy'); }}>Copy</button>
          <button style={actionBtn} onClick={(e) => { e.stopPropagation(); setPickerAction('move'); }}>Move</button>
          <button style={{ ...actionBtn, color: '#e55' }} onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${file.name}"?`)) onDelete(file.id);
          }}>Delete</button>
        </div>
      </div>
      {pickerAction && (
        <WorkspacePickerModal
          currentWorkspaceId={file.workspace_id}
          action={pickerAction}
          onSelect={handlePickerSelect}
          onClose={() => setPickerAction(null)}
        />
      )}
    </>
  );
}

const card: React.CSSProperties = {
  background: '#2a2a2a', borderRadius: 8, padding: 16, cursor: 'pointer',
  border: '1px solid #333', transition: 'border-color 0.2s',
};
const input: React.CSSProperties = {
  padding: '4px 8px', borderRadius: 4, border: '1px solid #555',
  background: '#1a1a1a', color: '#eee', fontSize: 14, width: '100%', boxSizing: 'border-box',
};
const actionBtn: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 4, border: '1px solid #444',
  background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: 12,
};
