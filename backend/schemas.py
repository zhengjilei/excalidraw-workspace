from datetime import datetime
from pydantic import BaseModel


# Workspace schemas
class WorkspaceCreate(BaseModel):
    name: str


class WorkspaceUpdate(BaseModel):
    name: str


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime
    file_count: int = 0

    model_config = {"from_attributes": True}


# File schemas
class FileCreate(BaseModel):
    name: str


class FileUpdate(BaseModel):
    name: str


class FileResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
