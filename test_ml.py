from backend.services.ml_service import predict_stress, FEATURE_NAMES
from backend.tests.fixtures_loader import get_case
import traceback

input_data = get_case("baseline_medium")["input"]

try:
    result = predict_stress(input_data)
    contribs = result.get("feature_contributions", [])
    assert contribs, "Feature contributions should not be empty"
    assert len(contribs) == len(FEATURE_NAMES), "Each feature must have a contribution"
    print("Stress level:", result["stress_level"])
    print("Top importance:", result["feature_importance"])
except Exception as e:
    traceback.print_exc()
