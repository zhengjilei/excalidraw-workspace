import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import WorkspaceView from './pages/WorkspaceView';
import Editor from './pages/Editor';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workspace/:workspaceId" element={<WorkspaceView />} />
        <Route path="/workspace/:workspaceId/file/:fileId" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  );
}
