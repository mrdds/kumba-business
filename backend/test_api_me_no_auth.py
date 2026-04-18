import requests

# Call /api/id/me on Kumba Business running locally on 8000 WITHOUT a token
url = 'http://localhost:8000/api/id/me'

print(f"Calling: {url}")
response = requests.get(url)

print(f"Status Code: {response.status_code}")
try:
    print(f"Response JSON: {response.json()}")
except Exception as e:
    pass
