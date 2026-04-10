import sys
import urllib.request
import urllib.error
import json
from backend.tests.fixtures_loader import get_case

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = "http://127.0.0.1:8080"

def req(method, path, data=None, headers=None):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(BASE + path, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

print("=" * 60)
print("MINDSCAN AI BACKEND - LIVE API TESTS")
print("=" * 60)

# 1. Root
s, d = req("GET", "/")
print(f"\n[1] ROOT {s}: {d}")
assert s == 200

# 2. Create session
s, d = req("POST", "/api/session")
session_id = d.get("session_id", "")
print(f"[2] CREATE SESSION {s}: {session_id[:8]}...")
assert s == 201 and session_id

# 3. Submit survey - predict
survey = get_case("high_stress")["input"]
s, d = req("POST", f"/api/predict?session_id={session_id}", data=survey)
pred = d.get("prediction", {})
pred_id = pred.get("pred_id")
stress = pred.get("stress_level")
conf = round(pred.get("confidence_score", 0), 3)
n_recs = len(pred.get("recommendations", []))
fi = pred.get("feature_importance", {})
print(f"[3] PREDICT {s}: stress_level={stress}, confidence={conf}, recs={n_recs}")
print(f"    Top features: {list(fi.items())[:3]}")
assert s == 200 and stress is not None

# 4. Get recommendations by pred_id
s, d = req("GET", f"/api/recommend/{pred_id}")
n = len(d) if isinstance(d, list) else 0
print(f"[4] RECOMMEND {s}: count={n}")
if isinstance(d, list):
    for r in d:
        print(f"    - [{r['category']}] {r['title']}")
assert s == 200

# 5. Get history
s, d = req("GET", f"/api/history/{session_id}")
print(f"[5] HISTORY {s}: predictions={len(d.get('predictions', []))}")
assert s == 200

# 6. Admin stats without token (expect 403)
s, d = req("GET", "/api/admin/stats")
print(f"[6] ADMIN NO TOKEN {s}: {d}")
assert s in (401, 403)

# 7. Invalid survey data (validation check)
bad = {"age": 5, "gender": "x", "anxiety_level": 99}
s, d = req("POST", f"/api/predict?session_id={session_id}", data=bad)
print(f"[7] INVALID SURVEY {s}: validation triggered={'detail' in d}")
assert s == 422

# 8. Nonexistent session history
s, d = req("GET", "/api/history/fake-session-does-not-exist")
print(f"[8] 404 SESSION {s}: {d}")
assert s == 404

# 9. Low-stress scenario (should return balanced recommendation)
s2, d2 = req("POST", "/api/session")
session_id2 = d2.get("session_id", "")
low_stress_survey = get_case("low_stress")["input"]
s, d = req("POST", f"/api/predict?session_id={session_id2}", data=low_stress_survey)
pred2 = d.get("prediction", {})
print(f"[9] LOW STRESS PREDICT {s}: stress_level={pred2.get('stress_level')}, recs={len(pred2.get('recommendations', []))}")
assert s == 200

print("\n" + "=" * 60)
print("ALL 9 TESTS PASSED")
print("=" * 60)
