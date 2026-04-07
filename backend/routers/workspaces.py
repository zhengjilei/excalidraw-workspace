import shutil
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config import WORKSPACES_DIR
from main import get_db
from models import Workspace, File
from schemas import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=201)
def create_workspace(body: WorkspaceCreate, db: Session = Depends(get_db)):
    ws = Workspace(id=str(uuid.uuid4()), name=body.name)
    db.add(ws)
    db.commit()
    db.refresh(ws)
    (WORKSPACES_DIR / ws.id).mkdir(parents=True, exist_ok=True)
    return WorkspaceResponse(
        id=ws.id, name=ws.name,
        created_at=ws.created_at, updated_at=ws.updated_at,
        file_count=0,
    )


@router.get("", response_model=list[WorkspaceResponse])
def list_workspaces(db: Session = Depends(get_db)):
    workspaces = db.query(Workspace).all()
    result = []
    for ws in workspaces:
        count = db.query(File).filter(File.workspace_id == ws.id).count()
        result.append(WorkspaceResponse(
            id=ws.id, name=ws.name,
            created_at=ws.created_at, updated_at=ws.updated_at,
            file_count=count,
        ))
    return result


@router.get("/{wid}", response_model=WorkspaceResponse)
def get_workspace(wid: str, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == wid).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    count = db.query(File).filter(File.workspace_id == ws.id).count()
    return WorkspaceResponse(
        id=ws.id, name=ws.name,
        created_at=ws.created_at, updated_at=ws.updated_at,
        file_count=count,
    )


@router.put("/{wid}", response_model=WorkspaceResponse)
def update_workspace(wid: str, body: WorkspaceUpdate, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == wid).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    ws.name = body.name
    ws.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ws)
    count = db.query(File).filter(File.workspace_id == ws.id).count()
    return WorkspaceResponse(
        id=ws.id, name=ws.name,
        created_at=ws.created_at, updated_at=ws.updated_at,
        file_count=count,
    )


@router.delete("/{wid}", status_code=204)
def delete_workspace(wid: str, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == wid).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    ws_dir = WORKSPACES_DIR / ws.id
    if ws_dir.exists():
        shutil.rmtree(ws_dir)
    db.delete(ws)
    db.commit()
    return None
