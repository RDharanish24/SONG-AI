import requests
API_KEY = "sksonauto_h3vV2NSCLT2ermBK6lX9vwgu4LxI_fd9kH__ZMFoHoJ_t6k_"
task_id = "4a701646-7ee3-4259-ab83-5d18b1bc0d36"
headers = {"Authorization": f"Bearer {API_KEY}"}

# Test 1: Generations Status
print("--- TEST 1: generations/status/{task_id} ---")
res1 = requests.get(f"https://api.sonauto.ai/v1/generations/status/{task_id}", headers=headers)
print("Status:", res1.status_code)
print("Response:", res1.text)

# Test 2: Generations Details
print("\n--- TEST 2: generations/{task_id} ---")
res2 = requests.get(f"https://api.sonauto.ai/v1/generations/{task_id}", headers=headers)
print("Status:", res2.status_code)
try:
    print("Response keys:", list(res2.json().keys()))
    print("Full Response:", res2.json())
except Exception as e:
    print("Response text:", res2.text)

# Test 3: Tasks Details
print("\n--- TEST 3: tasks/{task_id} ---")
res3 = requests.get(f"https://api.sonauto.ai/v1/tasks/{task_id}", headers=headers)
print("Status:", res3.status_code)
try:
    print("Full Response:", res3.json())
except Exception as e:
    print("Response text:", res3.text)