import os
from dotenv import load_dotenv
import urllib.parse

# Load from .env explicitly
load_dotenv(override=True)

mongo_url = os.getenv("MONGO_URL")

if not mongo_url:
    print("❌ MONGO_URL not found in .env")
    exit(1)

print(f"Loaded MONGO_URL starting with: {mongo_url[:15]}...")

# Check for unescaped @
try:
    # A naive check: splitting by @. 
    # Valid: mongodb+srv://user:pass@host/db
    # Invalid: mongodb+srv://user:pa@ss@host/db
    
    parts = mongo_url.split("@")
    if len(parts) > 2:
        print("❌ DETECTED ISSUE: Multiple '@' symbols found.")
        print("You likely have an '@' in your password that is not escaped.")
        print("Please replace '@' with '%40' in your password.")
    else:
        print("✅ '@' symbol count looks okay (or URL is malformed in other ways).")

except Exception as e:
    print(f"Error checking string: {e}")

# Try to parse with pymongo explicitly to confirm validity
try:
    from pymongo.uri_parser import parse_uri
    parse_uri(mongo_url)
    print("✅ Pymongo considers this URL valid.")
except Exception as e:
    print(f"❌ Pymongo explicitly rejects this URL: {e}")
