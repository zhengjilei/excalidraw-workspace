import type { Workspace, ExcalidrawFile, ImportResult } from './types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// Workspaces
export const listWorkspaces = () => request<Workspace[]>('/api/workspaces');
export const getWorkspace = (id: string) => request<Workspace>(`/api/workspaces/${id}`);
export const createWorkspace = (name: string) => request<Workspace>('/api/workspaces', json({ name }));
export const renameWorkspace = (id: string, name: string) =>
  request<Workspace>(`/api/workspaces/${id}`, { ...json({ name }), method: 'PUT' });
export const deleteWorkspace = (id: string) =>
  request<void>(`/api/workspaces/${id}`, { method: 'DELETE' });

// Files
export const listFiles = (wid: string) => request<ExcalidrawFile[]>(`/api/workspaces/${wid}/files`);
export const getFile = (wid: string, fid: string) =>
  request<ExcalidrawFile>(`/api/workspaces/${wid}/files/${fid}`);
export const createFile = (wid: string, name: string) =>
  request<ExcalidrawFile>(`/api/workspaces/${wid}/files`, json({ name }));
export const renameFile = (wid: string, fid: string, name: string) =>
  request<ExcalidrawFile>(`/api/workspaces/${wid}/files/${fid}`, { ...json({ name }), method: 'PUT' });
export const deleteFile = (wid: string, fid: string) =>
  request<void>(`/api/workspaces/${wid}/files/${fid}`, { method: 'DELETE' });

// File content
export const getFileContent = (wid: string, fid: string) =>
  request<Record<string, unknown>>(`/api/workspaces/${wid}/files/${fid}/content`);
export const saveFileContent = (wid: string, fid: string, data: Record<string, unknown>) =>
  request<{ status: string }>(`/api/workspaces/${wid}/files/${fid}/content`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

// Move/Copy
export const copyFile = (wid: string, fid: string, targetWid: string) =>
  request<ExcalidrawFile>(`/api/workspaces/${wid}/files/${fid}/copy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_workspace_id: targetWid }),
  });
export const moveFile = (wid: string, fid: string, targetWid: string) =>
  request<ExcalidrawFile>(`/api/workspaces/${wid}/files/${fid}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_workspace_id: targetWid }),
  });

// Import
export const uploadFiles = (wid: string, files: File[]) => {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return request<ImportResult>(`/api/workspaces/${wid}/upload`, { method: 'POST', body: form });
};
