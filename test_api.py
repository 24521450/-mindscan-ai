import urllib.request
import urllib.error
import json
from backend.tests.fixtures_loader import get_case

req1 = urllib.request.Request('http://localhost:8080/api/session', method='POST')
with urllib.request.urlopen(req1) as resp1:
    session_id = json.loads(resp1.read().decode())['session_id']

data = get_case("baseline_medium")["input"]
req2 = urllib.request.Request(f'http://localhost:8080/api/predict?session_id={session_id}', data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    resp2 = urllib.request.urlopen(req2)
    print(resp2.read().decode())
except urllib.error.HTTPError as e:
    print('Err:', e.read().decode())
