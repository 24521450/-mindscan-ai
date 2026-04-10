from backend.tests.fixtures_loader import get_case


def test_register_login_me_and_user_history(api_client):
    register_payload = {
        "email": "auth.user@example.com",
        "password": "StrongPass123",
        "name": "Auth User",
    }
    register_res = api_client.post("/api/auth/register", json=register_payload)
    assert register_res.status_code == 201
    user_body = register_res.json()
    assert user_body["email"] == "auth.user@example.com"

    login_res = api_client.post(
        "/api/auth/login",
        json={"email": register_payload["email"], "password": register_payload["password"]},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_res = api_client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == register_payload["email"]

    session_res = api_client.post("/api/session", headers=headers)
    assert session_res.status_code == 201
    session_id = session_res.json()["session_id"]
    assert session_res.json()["user_id"] is not None

    payload = get_case("baseline_medium")["input"]
    predict_res = api_client.post(f"/api/predict?session_id={session_id}", json=payload)
    assert predict_res.status_code == 200

    history_res = api_client.get("/api/user/history", headers=headers)
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) >= 1
    assert "prediction" in history[0]
    assert "model_version" in history[0]["prediction"]
