import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Excalidraw, exportToSvg, exportToBlob } from '@excalidraw/excalidraw';
import { getFile, getFileContent, saveFileContent, renameFile } from '../api/client';
import type { ExcalidrawFile } from '../api/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawElement = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppState = any;

const SAVE_KEYS = ['viewBackgroundColor', 'gridSize', 'gridStep', 'gridModeEnabled'];

function cleanAppState(appState: Partial<AppState>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const key of SAVE_KEYS) {
    if (key in appState) clean[key] = (appState as Record<string, unknown>)[key];
  }
  return clean;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Editor() {
  const { workspaceId, fileId } = useParams<{ workspaceId: string; fileId: string }>();
  const [file, setFile] = useState<ExcalidrawFile | null>(null);
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [showExport, setShowExport] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<{ elements: readonly ExcalidrawElement[]; appState: Partial<AppState> } | null>(null);

  useEffect(() => {
    if (!workspaceId || !fileId) return;
    getFile(workspaceId, fileId).then((f) => { setFile(f); setName(f.name); });
    getFileContent(workspaceId, fileId).then(setInitialData);
  }, [workspaceId, fileId]);

  const doSave = useCallback(async () => {
    if (!workspaceId || !fileId || !latestRef.current) return;
    const { elements, appState } = latestRef.current;
    setSaveStatus('saving');
    try {
      await saveFileContent(workspaceId, fileId, {
        type: 'excalidraw',
        version: 2,
        elements: elements as unknown as Record<string, unknown>[],
        appState: cleanAppState(appState),
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [workspaceId, fileId]);

  const handleChange = useCallback((elements: readonly ExcalidrawElement[], appState: AppState) => {
    latestRef.current = { elements, appState };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, 1500);
  }, [doSave]);

  const handleRename = async () => {
    if (!workspaceId || !fileId) return;
    if (name.trim() && name.trim() !== file?.name) {
      const updated = await renameFile(workspaceId, fileId, name.trim());
      setFile(updated);
    }
    setEditingName(false);
  };

  const getExportData = () => {
    if (!latestRef.current) return null;
    return {
      elements: latestRef.current.elements as ExcalidrawElement[],
      appState: latestRef.current.appState,
      files: null,
    };
  };

  const handleExportExcalidraw = () => {
    const data = getExportData();
    if (!data) return;
    const json = JSON.stringify({
      type: 'excalidraw',
      version: 2,
      elements: data.elements,
      appState: cleanAppState(data.appState),
    }, null, 2);
    download(new Blob([json], { type: 'application/json' }), `${file?.name || 'drawing'}.excalidraw`);
    setShowExport(false);
  };

  const handleExportSvg = async () => {
    const data = getExportData();
    if (!data) return;
    const svg = await exportToSvg({ elements: data.elements, appState: data.appState, files: null });
    const svgStr = new XMLSerializer().serializeToString(svg);
    download(new Blob([svgStr], { type: 'image/svg+xml' }), `${file?.name || 'drawing'}.svg`);
    setShowExport(false);
  };

  const handleExportPng = async () => {
    const data = getExportData();
    if (!data) return;
    const blob = await exportToBlob({ elements: data.elements, appState: data.appState, files: null });
    download(blob, `${file?.name || 'drawing'}.png`);
    setShowExport(false);
  };

  if (!initialData) return <div style={{ background: '#1a1a1a', color: '#eee', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  const statusText = saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error saving' : '';
  const statusColor = saveStatus === 'error' ? '#e55' : '#999';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1a1a1a' }}>
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to={`/workspace/${workspaceId}`} style={{ color: '#6965db', textDecoration: 'none', fontSize: 13 }}>
            &larr; Back
          </Link>
          <span style={{ color: '#444' }}>|</span>
          {editingName ? (
            <input
              autoFocus
              style={nameInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingName(false); }}
              onBlur={handleRename}
            />
          ) : (
            <span style={{ color: '#eee', cursor: 'pointer', fontSize: 15 }} onClick={() => setEditingName(true)}>
              {file?.name || 'Untitled'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: statusColor }}>{statusText}</span>
          <div style={{ position: 'relative' }}>
            <button style={exportBtn} onClick={() => setShowExport(!showExport)}>Export</button>
            {showExport && (
              <div style={dropdown}>
                <button style={dropdownItem} onClick={handleExportExcalidraw}>.excalidraw</button>
                <button style={dropdownItem} onClick={handleExportSvg}>.svg</button>
                <button style={dropdownItem} onClick={handleExportPng}>.png</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <Excalidraw
          initialData={{
            elements: (initialData.elements || []) as ExcalidrawElement[],
            appState: (initialData.appState || {}) as Partial<AppState>,
          }}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

const header: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '8px 16px', background: '#2a2a2a', borderBottom: '1px solid #333',
  zIndex: 10,
};
const nameInput: React.CSSProperties = {
  padding: '2px 8px', borderRadius: 4, border: '1px solid #555',
  background: '#1a1a1a', color: '#eee', fontSize: 15,
};
const exportBtn: React.CSSProperties = {
  padding: '4px 12px', borderRadius: 4, border: '1px solid #555',
  background: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: 13,
};
const dropdown: React.CSSProperties = {
  position: 'absolute', right: 0, top: '100%', marginTop: 4,
  background: '#2a2a2a', border: '1px solid #444', borderRadius: 4,
  overflow: 'hidden', zIndex: 100, minWidth: 120,
};
const dropdownItem: React.CSSProperties = {
  display: 'block', width: '100%', padding: '8px 16px', border: 'none',
  background: 'transparent', color: '#eee', cursor: 'pointer', fontSize: 13,
  textAlign: 'left',
};
