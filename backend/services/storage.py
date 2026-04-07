import json
from pathlib import Path


def read_file(path: Path) -> dict:
    with open(path, "r") as f:
        return json.load(f)


def write_file(path: Path, data: dict) -> None:
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def delete_file(path: Path) -> None:
    if path.exists():
        path.unlink()
