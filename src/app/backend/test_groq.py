import os
from groq import Groq

# Replace with your EXACT API key
API_KEY = "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"

print(f"Testing API key: {API_KEY[:20]}...")
print(f"Key length: {len(API_KEY)}")
print(f"Starts with gsk_: {API_KEY.startswith('gsk_')}")

try:
    client = Groq(api_key=API_KEY)
    
    print("Making test API call...")
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": "Hello, world!",
            }
        ],
        model="llama3-8b-8192",
    )
    
    print("✅ SUCCESS!")
    print("Response:", chat_completion.choices[0].message.content)
    
except Exception as e:
    print(f"❌ FAILED: {e}")
    print(f"Error type: {type(e)}")