export interface Workspace {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  file_count: number;
}

export interface ExcalidrawFile {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}
