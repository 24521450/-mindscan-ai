import json
from pathlib import Path
from typing import Any, Dict, List

FIXTURES_DIR = Path(__file__).parent / "fixtures"
COMMON_CASES_PATH = FIXTURES_DIR / "common_cases.json"
GOLDEN_CASES_PATH = FIXTURES_DIR / "golden_cases.json"


def _read_json(file_path: Path) -> Dict[str, Any]:
    with file_path.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_cases() -> List[Dict[str, Any]]:
    """Prefer golden cases when available, otherwise fallback to common cases."""
    if GOLDEN_CASES_PATH.exists():
        return _read_json(GOLDEN_CASES_PATH).get("cases", [])
    if COMMON_CASES_PATH.exists():
        return _read_json(COMMON_CASES_PATH).get("cases", [])
    raise FileNotFoundError("No test fixture file found in backend/tests/fixtures")


def get_case(case_id: str) -> Dict[str, Any]:
    for case in load_cases():
        if case.get("id") == case_id:
            return case
    raise KeyError(f"Fixture case '{case_id}' was not found")
