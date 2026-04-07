import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Workspace, ExcalidrawFile } from '../api/types';
import { getWorkspace, listFiles, createFile, renameFile, deleteFile } from '../api/client';
import FileCard from '../components/FileCard';
import ImportModal from '../components/ImportModal';

export default function WorkspaceView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [files, setFiles] = useState<ExcalidrawFile[]>([]);
  const [showImport, setShowImport] = useState(false);

  const load = () => {
    if (!workspaceId) return;
    getWorkspace(workspaceId).then(setWorkspace);
    listFiles(workspaceId).then(setFiles);
  };
  useEffect(() => { load(); }, [workspaceId]);

  const handleNew = async () => {
    if (!workspaceId) return;
    const file = await createFile(workspaceId, 'Untitled');
    navigate(`/workspace/${workspaceId}/file/${file.id}`);
  };

  const handleRename = async (fid: string, name: string) => {
    if (!workspaceId) return;
    await renameFile(workspaceId, fid, name);
    load();
  };

  const handleDelete = async (fid: string) => {
    if (!workspaceId) return;
    await deleteFile(workspaceId, fid);
    load();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', color: '#eee', padding: 32 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 8, fontSize: 13 }}>
          <Link to="/" style={{ color: '#6965db', textDecoration: 'none' }}>Workspaces</Link>
          <span style={{ color: '#666' }}> / {workspace?.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>{workspace?.name}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={actionBtn} onClick={() => setShowImport(true)}>Import</button>
            <button style={primaryBtn} onClick={handleNew}>+ New Drawing</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {files.map((f) => (
            <FileCard key={f.id} file={f} onRename={handleRename} onDelete={handleDelete} />
          ))}
        </div>
        {files.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', marginTop: 48 }}>No files yet. Create a new drawing or import files.</p>
        )}
      </div>
      {showImport && workspaceId && (
        <ImportModal workspaceId={workspaceId} onClose={() => setShowImport(false)} onDone={load} />
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 4, border: 'none', background: '#6965db',
  color: '#fff', cursor: 'pointer', fontSize: 14,
};
const actionBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 4, border: '1px solid #555', background: 'transparent',
  color: '#ccc', cursor: 'pointer', fontSize: 14,
};
