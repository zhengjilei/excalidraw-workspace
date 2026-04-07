import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from config import WORKSPACES_DIR
from models import File
from services.storage import write_file


def validate_excalidraw(data: dict) -> bool:
    return data.get("type") == "excalidraw" or isinstance(data.get("elements"), list)


def import_from_path(directory: str, workspace_id: str, db: Session, recursive: bool = False) -> dict:
    dir_path = Path(directory)
    if not dir_path.is_dir():
        return {"imported": 0, "skipped": 0, "errors": [f"{directory}: not a valid directory"]}

    imported = 0
    skipped = 0
    errors = []

    pattern = "**/*" if recursive else "*"
    for file_path in dir_path.glob(pattern):
        if file_path.suffix not in (".excalidraw", ".json"):
            continue
        try:
            with open(file_path) as f:
                data = json.load(f)
            if not validate_excalidraw(data):
                errors.append(f"{file_path.name}: invalid excalidraw format")
                skipped += 1
                continue
            file_id = str(uuid.uuid4())
            dest = WORKSPACES_DIR / workspace_id / f"{file_id}.excalidraw"
            write_file(dest, data)
            db_file = File(
                id=file_id,
                workspace_id=workspace_id,
                name=file_path.stem,
            )
            db.add(db_file)
            imported += 1
        except (json.JSONDecodeError, OSError) as e:
            errors.append(f"{file_path.name}: {str(e)}")
            skipped += 1

    db.commit()
    return {"imported": imported, "skipped": skipped, "errors": errors}


async def import_from_upload(files, workspace_id: str, db: Session) -> dict:
    imported = 0
    skipped = 0
    errors = []

    for upload_file in files:
        try:
            content = await upload_file.read()
            data = json.loads(content)
            if not validate_excalidraw(data):
                errors.append(f"{upload_file.filename}: invalid excalidraw format")
                skipped += 1
                continue
            file_id = str(uuid.uuid4())
            dest = WORKSPACES_DIR / workspace_id / f"{file_id}.excalidraw"
            write_file(dest, data)
            name = Path(upload_file.filename).stem if upload_file.filename else "Untitled"
            db_file = File(
                id=file_id,
                workspace_id=workspace_id,
                name=name,
            )
            db.add(db_file)
            imported += 1
        except (json.JSONDecodeError, OSError) as e:
            errors.append(f"{upload_file.filename}: {str(e)}")
            skipped += 1

    db.commit()
    return {"imported": imported, "skipped": skipped, "errors": errors}
