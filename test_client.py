from fastapi.testclient import TestClient
from backend.main import app
import traceback

client = TestClient(app)
res_session = client.post("/api/session")
session_id = res_session.json()["session_id"]

payload = { 'age': 20, 'gender': 'male', 'anxiety_level': 5, 'depression': 5, 'self_esteem': 15, 'mental_health_history': 0, 'blood_pressure': 2, 'sleep_quality': 3, 'headache': 0, 'breathing_problem': 0, 'study_load': 3, 'academic_performance': 3, 'teacher_student_relationship': 3, 'future_career_concerns': 3, 'social_support': 1, 'peer_pressure': 0, 'extracurricular_activities': 2, 'bullying': 0, 'noise_level': 0, 'living_conditions': 3, 'safety': 3, 'basic_needs': 3 }

try:
    response = client.post(f"/api/predict?session_id={session_id}", json=payload)
    print("STATUS CODE:", response.status_code)
    print("BODY:", response.text)
except Exception as e:
    traceback.print_exc()
