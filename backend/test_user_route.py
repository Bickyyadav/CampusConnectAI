import requests
import json
import random

base_url = "http://127.0.0.1:8000"

# 1. Check Health
try:
    print("Checking health...")
    health = requests.get(f"{base_url}/users/health")
    print(f"Health Status: {health.status_code}")
    print(f"Health Body: {health.text}")
except Exception as e:
    print(f" Could not reach health endpoint: {e}")
    exit(1)

# 2. Try Create User
rand_id = random.randint(1000, 9999)
url = f"{base_url}/users/"
payload = {
    "name": f"Test User {rand_id}",
    "email": f"test{rand_id}@example.com"
}

print(f"\nSending POST to {url} with data: {payload}")

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 200:
        print(" Success! User created.")
    else:
        print(" Failed.")
except Exception as e:
    print(f" Error during request: {e}")
