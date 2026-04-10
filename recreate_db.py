"""
Reset the database schema using Alembic (downgrade to empty, then apply all migrations).

Run from the repository root with venv activated and backend/.env configured:
    python recreate_db.py

Requires: pip install -r backend/requirements.txt
"""
import subprocess
import sys


def main() -> None:
    subprocess.check_call([sys.executable, "-m", "alembic", "downgrade", "base"])
    subprocess.check_call([sys.executable, "-m", "alembic", "upgrade", "head"])
    print("Database schema recreated (Alembic: downgrade base → upgrade head).")


if __name__ == "__main__":
    main()
