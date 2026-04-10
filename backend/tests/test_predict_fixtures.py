from backend.tests.fixtures_loader import get_case


def test_fixture_cases_available(fixture_cases):
    assert fixture_cases, "Fixture cases must not be empty"
    assert all("input" in case for case in fixture_cases)


def test_predict_with_common_fixture_case(api_client):
    session_res = api_client.post("/api/session")
    assert session_res.status_code == 201
    session_id = session_res.json()["session_id"]

    payload = get_case("baseline_medium")["input"]
    predict_res = api_client.post(f"/api/predict?session_id={session_id}", json=payload)

    assert predict_res.status_code == 200
    body = predict_res.json()["prediction"]
    assert "stress_level" in body
    assert "confidence_score" in body
    assert "model_version" in body
    assert "feature_importance" in body
