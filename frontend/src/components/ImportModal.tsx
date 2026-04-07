import { useState, useCallback } from 'react';
import type { ImportResult } from '../api/types';
import { uploadFiles } from '../api/client';

interface Props {
  workspaceId: string;
  onClose: () => void;
  onDone: () => void;
}

export default function ImportModal({ workspaceId, onClose, onDone }: Props) {
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(async (files: File[]) => {
    const valid = files.filter((f) => f.name.endsWith('.excalidraw') || f.name.endsWith('.json'));
    if (valid.length === 0) return;
    setUploading(true);
    try {
      const res = await uploadFiles(workspaceId, valid);
      setResult(res);
      onDone();
    } catch {
      setResult({ imported: 0, skipped: 0, errors: ['Upload failed'] });
    } finally {
      setUploading(false);
    }
  }, [workspaceId, onDone]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files));
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 16px' }}>Import Files</h2>
        {!result ? (
          <>
            <div
              style={{ ...dropzone, borderColor: dragging ? '#6965db' : '#555' }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {uploading ? (
                <p>Uploading...</p>
              ) : (
                <>
                  <p style={{ margin: 0 }}>Drag & drop .excalidraw / .json files here</p>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#999' }}>or</p>
                  <label style={browseBtn}>
                    Browse files
                    <input type="file" multiple accept=".excalidraw,.json" style={{ display: 'none' }} onChange={handleFileInput} />
                  </label>
                </>
              )}
            </div>
          </>
        ) : (
          <div>
            <p>Imported: {result.imported}</p>
            {result.skipped > 0 && <p>Skipped: {result.skipped}</p>}
            {result.errors.length > 0 && (
              <ul style={{ color: '#e55', fontSize: 13 }}>
                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
            <button style={closeBtn} onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modal: React.CSSProperties = {
  background: '#2a2a2a', borderRadius: 8, padding: 24, minWidth: 400, color: '#eee',
};
const dropzone: React.CSSProperties = {
  border: '2px dashed #555', borderRadius: 8, padding: 32,
  textAlign: 'center', transition: 'border-color 0.2s',
};
const browseBtn: React.CSSProperties = {
  display: 'inline-block', marginTop: 8, padding: '6px 14px', borderRadius: 4,
  border: '1px solid #555', color: '#ccc', cursor: 'pointer', fontSize: 13,
};
const closeBtn: React.CSSProperties = {
  marginTop: 12, padding: '8px 16px', borderRadius: 4, border: 'none',
  background: '#6965db', color: '#fff', cursor: 'pointer',
};
