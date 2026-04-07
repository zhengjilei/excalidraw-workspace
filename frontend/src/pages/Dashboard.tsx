import { useEffect, useState } from 'react';
import type { Workspace } from '../api/types';
import { listWorkspaces, createWorkspace, renameWorkspace, deleteWorkspace } from '../api/client';
import WorkspaceCard from '../components/WorkspaceCard';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showModal, setShowModal] = useState(false);

  const load = () => listWorkspaces().then(setWorkspaces);
  useEffect(() => { load(); }, []);

  const handleCreate = async (name: string) => {
    await createWorkspace(name);
    setShowModal(false);
    load();
  };

  const handleRename = async (id: string, name: string) => {
    await renameWorkspace(id, name);
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteWorkspace(id);
    load();
  };

  return (
    <div style={{ height: '100vh', overflow: 'auto', background: '#1a1a1a', color: '#eee', padding: 32 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>Excalidraw Workspaces</h1>
          <button style={createBtn} onClick={() => setShowModal(true)}>+ Create Workspace</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {workspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} onRename={handleRename} onDelete={handleDelete} />
          ))}
        </div>
        {workspaces.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', marginTop: 48 }}>No workspaces yet. Create one to get started.</p>
        )}
      </div>
      {showModal && <CreateWorkspaceModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
    </div>
  );
}

const createBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 4, border: 'none', background: '#6965db',
  color: '#fff', cursor: 'pointer', fontSize: 14,
};
