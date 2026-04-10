import asyncio
from typing import Any, Dict, List

import pytest
from fastapi.testclient import TestClient

from backend import models  # noqa: F401
from backend.database import Base, engine
from backend.main import app
from backend.tests.fixtures_loader import load_cases


@pytest.fixture(scope="session")
def fixture_cases() -> List[Dict[str, Any]]:
    return load_cases()


@pytest.fixture(scope="session")
def api_client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def prepare_test_db() -> None:
    async def _prepare() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(_prepare())
