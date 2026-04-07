import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import WORKSPACES_DIR
from main import get_db
from models import Workspace, File
from schemas import FileCreate, FileUpdate, FileResponse
from services.storage import read_file, write_file, delete_file as delete_file_from_disk
from services.importer import import_from_path, import_from_upload

router = APIRouter(prefix="/api/workspaces/{wid}", tags=["files"])


class ImportRequest(BaseModel):
    path: str
    recursive: bool = False

EMPTY_SCENE = {"type": "excalidraw", "version": 2, "elements": [], "appState": {}}


def _get_workspace_or_404(wid: str, db: Session) -> Workspace:
    ws = db.query(Workspace).filter(Workspace.id == wid).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return ws


def _get_file_or_404(fid: str, wid: str, db: Session) -> File:
    f = db.query(File).filter(File.id == fid, File.workspace_id == wid).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    return f


def _file_path(wid: str, fid: str):
    return WORKSPACES_DIR / wid / f"{fid}.excalidraw"


@router.post("/files", response_model=FileResponse, status_code=201)
def create_file(wid: str, body: FileCreate, db: Session = Depends(get_db)):
    _get_workspace_or_404(wid, db)
    file = File(id=str(uuid.uuid4()), workspace_id=wid, name=body.name)
    db.add(file)
    db.commit()
    db.refresh(file)
    write_file(_file_path(wid, file.id), EMPTY_SCENE)
    return file


@router.get("/files", response_model=list[FileResponse])
def list_files(wid: str, db: Session = Depends(get_db)):
    _get_workspace_or_404(wid, db)
    return db.query(File).filter(File.workspace_id == wid).all()


@router.get("/files/{fid}", response_model=FileResponse)
def get_file(wid: str, fid: str, db: Session = Depends(get_db)):
    _get_workspace_or_404(wid, db)
    return _get_file_or_404(fid, wid, db)


@router.get("/files/{fid}/content")
def get_file_content(wid: str, fid: str, db: Session = Depends(get_db)):
    _get_workspace_or_404(wid, db)
    _get_file_or_404(fid, wid, db)
    path = _file_path(wid, fid)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File content not found on disk")
    data = read_file(path)
    return JSONResponse(content=data)


@router.put("/files/{fid}/content")
async def save_file_content(wid: str, fid: str, request: Request, db: Session = Depends(get_db)):
    _get_workspace_or_404(wid, db)
    file = _get_file_or_404(fid, wid, db)
    data = await request.json()
    write_file(_file_path(wid, fid), data)
    file.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "ok"}


@router.put("/files/{fid}", response_model=FileResponse)
def rename_file(wid: str, fid: str, body: FileUpdate, db: Session = Depends(get_db)):
    _get_workspace_or_404(wid, db)
    file = _get_file_or_404(fid, wid, db)
    file.name = body.name
    file.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(file)
    return file


@router.delete("/files/{fid}", status_code=204)
def delete_file(wid: str, fid: str, db: Session = Depends(get_db)):
    _get_workspace_or_404(wid, db)
    file = _get_file_or_404(fid, wid, db)
    delete_file_from_disk(_file_path(wid, fid))
    db.delete(file)
    db.commit()
    return None


@router.post("/import")
def import_files(wid: str, body: ImportRequest, db: Session = Depends(get_db)):
    _get_workspace_or_404(wid, db)
    result = import_from_path(body.path, wid, db, body.recursive)
    return result


@router.post("/upload")
async def upload_files(wid: str, files: list[UploadFile], db: Session = Depends(get_db)):
    _get_workspace_or_404(wid, db)
    result = await import_from_upload(files, wid, db)
    return result
