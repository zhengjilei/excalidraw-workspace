import os
from pathlib import Path

DATA_DIR = Path(os.environ.get("DATA_DIR", "./data"))
DB_PATH = DATA_DIR / "db.sqlite"
WORKSPACES_DIR = DATA_DIR / "workspaces"
