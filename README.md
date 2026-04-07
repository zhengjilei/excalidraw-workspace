# Excalidraw Workspace

Self-hosted Excalidraw with workspace and file management. Organize drawings into workspaces, import/export files, and auto-save everything locally.

## Features

- **Workspaces** - Create, rename, delete workspaces to organize drawings
- **Excalidraw Editor** - Full Excalidraw drawing experience with auto-save (1.5s debounce)
- **File Management** - Create, rename, delete, move, copy files between workspaces
- **Import** - Drag & drop files or select entire folders, batch import `.excalidraw` / `.json` files
- **Export** - Download as `.excalidraw`, `.svg`, or `.png`
- **Search** - Filter files by name within a workspace
- **Persistence** - SQLite database + filesystem storage, data survives restarts

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + TypeScript + Vite |
| Drawing | `@excalidraw/excalidraw` |
| Backend | Python 3.12 + FastAPI |
| Storage | Local filesystem (JSON files) |
| DB | SQLite via SQLAlchemy 2.0 |
| Deploy | Docker Compose |

## Quick Start

### One-click

```bash
./start.sh
```

Open http://localhost:5173

### Manual (dev mode)

```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Docker

```bash
docker compose up --build -d
```

Open http://localhost:8080

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/workspaces` | List workspaces |
| GET | `/api/workspaces/{id}` | Get workspace |
| PUT | `/api/workspaces/{id}` | Rename workspace |
| DELETE | `/api/workspaces/{id}` | Delete workspace |
| POST | `/api/workspaces/{id}/files` | Create file |
| GET | `/api/workspaces/{id}/files` | List files |
| GET | `/api/workspaces/{id}/files/{fid}` | Get file metadata |
| GET | `/api/workspaces/{id}/files/{fid}/content` | Get drawing content |
| PUT | `/api/workspaces/{id}/files/{fid}/content` | Save drawing content |
| PUT | `/api/workspaces/{id}/files/{fid}` | Rename file |
| DELETE | `/api/workspaces/{id}/files/{fid}` | Delete file |
| POST | `/api/workspaces/{id}/files/{fid}/copy` | Copy file to another workspace |
| POST | `/api/workspaces/{id}/files/{fid}/move` | Move file to another workspace |
| POST | `/api/workspaces/{id}/upload` | Upload files (multipart) |
| POST | `/api/workspaces/{id}/import` | Import from server directory |
