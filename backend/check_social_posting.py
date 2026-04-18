import requests

LOGIN_URL = "http://192.168.1.72:8000/api/auth/pair"
SOCIAL_POSTS_URL = "http://192.168.1.72:8000/api/social/posts"
SOCIAL_FEED_URL = "http://192.168.1.72:8000/api/social/feed"

CREDENTIALS = {
    "username": "mrdds",
    "password": "Aboulaye1996@"
}

POST_CONTENT = "Hello Kumba World! This is a test post from the MVP verification script. 🚀"

def test_social():
    print("1. Logging in...")
    login_res = requests.post(LOGIN_URL, json=CREDENTIALS)
    if login_res.status_code != 200:
        print(f"Login Failed: {login_res.text}")
        return
        
    token = login_res.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create Post
    print("\n2. Creating Post...")
    post_payload = {"content": POST_CONTENT}
    create_res = requests.post(SOCIAL_POSTS_URL, json=post_payload, headers=headers)
    
    if create_res.status_code == 200:
        print("   Post Created SUCCESS!")
        print(f"   Post ID: {create_res.json()['id']}")
    else:
        print(f"   Post Creation FAILED: {create_res.status_code}")
        print(f"   Response: {create_res.text}")
        return

    # Check Feed
    print("\n3. Checking Feed...")
    feed_res = requests.get(SOCIAL_FEED_URL, headers=headers)
    if feed_res.status_code == 200:
        posts = feed_res.json()
        print(f"   Feed Loaded. Count: {len(posts)}")
        if len(posts) > 0:
            print(f"   First Post: {posts[0]['content'][:50]}...")
    else:
        print(f"   Feed FAILED: {feed_res.status_code}")

if __name__ == "__main__":
    test_social()
