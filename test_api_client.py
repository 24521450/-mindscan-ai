from fastapi.testclient import TestClient
from backend.main import app
from backend.tests.fixtures_loader import get_case
import traceback

client = TestClient(app)
res_session = client.post("/api/session")
session_id = res_session.json()["session_id"]

payload = get_case("baseline_medium")["input"]

try:
    response = client.post(f"/api/predict?session_id={session_id}", json=payload)
    print("STATUS CODE:", response.status_code)
    print("BODY:", response.text)
except Exception as e:
    traceback.print_exc()
