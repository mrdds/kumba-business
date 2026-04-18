import requests
from verify_dashboard import get_auth_token

BASE_URL = "http://localhost:8001/api"

def test_tontine_flow():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 1. Create a Tontine Group
    print("Creating Tontine Group...")
    group_payload = {
        "name": "Family Savings 2026",
        "contribution_amount": 500.00,
        "frequency": "MONTHLY",
        "start_date": "2026-01-01"
    }
    
    res = requests.post(f"{BASE_URL}/tontines", json=group_payload, headers=headers)
    if res.status_code != 201:
        print(f"Failed to create group: {res.status_code}")
        print(res.text)
        return
    
    group_data = res.json()
    group_id = group_data['id']
    print(f"Group Created: ID {group_id} - {group_data['name']}")

    # 2. Add Members
    print("Adding Members...")
    members = ["Alice", "Bob", "Charlie"]
    member_ids = []
    
    for name in members:
        res = requests.post(f"{BASE_URL}/tontines/{group_id}/members", json={"name": name}, headers=headers)
        if res.status_code == 201:
            m_data = res.json()
            member_ids.append(m_data['id'])
            print(f"Added member: {m_data['name']} (ID: {m_data['id']})")
        else:
            print(f"Failed to add member {name}: {res.status_code}")
            print(res.text)
    
    # 3. Record Contribution
    print(f"Recording Contribution for {members[0]}...")
    contrib_payload = {
        "member_id": member_ids[0],
        "date": "2026-01-05",
        "amount": 500.00,
        "status": "PAID"
    }
    res = requests.post(f"{BASE_URL}/tontines/{group_id}/contribute", json=contrib_payload, headers=headers)
    
    if res.status_code == 201:
        print("Contribution Success.")
    else:
        print(f"Failed to contribute: {res.status_code}")
        print(res.text)

    # 4. Check Status
    print("Checking Status Grid...")
    res = requests.get(f"{BASE_URL}/tontines/{group_id}/contributions", headers=headers)
    if res.status_code == 200:
        data = res.json()
        print(f"Found {len(data)} contributions.")
        if len(data) > 0:
            print(f"First Record: {data[0]}")
    else:
        print(f"Failed to get grid: {res.status_code}")

if __name__ == "__main__":
    test_tontine_flow()
