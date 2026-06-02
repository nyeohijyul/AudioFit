import urllib.request
import urllib.parse
import json

url = 'https://exercisedb.p.rapidapi.com/exercises/equipment/body%20weight'
query = {'limit': '10'}
request_url = f"{url}?{urllib.parse.urlencode(query)}"
req = urllib.request.Request(request_url, headers={'Accept': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=20) as resp:
        print('status', resp.status)
        data = json.loads(resp.read().decode('utf-8'))
        print('type', type(data).__name__)
        if isinstance(data, list):
            print('count', len(data))
        else:
            print(data)
except Exception as exc:
    print('error', type(exc).__name__, exc)
