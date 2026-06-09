import urllib.request
import urllib.error
import urllib.parse
import json
import re

BASE_URL = "http://localhost:5173"

def test_health():
    print("Testing /api/health...")
    req = urllib.request.Request(f"{BASE_URL}/api/health")
    with urllib.request.urlopen(req) as response:
        assert response.status == 200
        assert "application/json" in response.headers.get("Content-Type", "")
        data = json.loads(response.read().decode("utf-8"))
        assert data == {"status": "ok"}
    print("✓ /api/health passed")

def test_csrf_generation():
    print("Testing /csrf generation...")
    req = urllib.request.Request(f"{BASE_URL}/csrf")
    with urllib.request.urlopen(req) as response:
        assert response.status == 200
        assert "application/json" in response.headers.get("Content-Type", "")
        data = json.loads(response.read().decode("utf-8"))
        token = data.get("token")
        assert token is not None
        assert re.match(r"^[0-9a-f]{32}$", token)
        
        # Check cookie
        set_cookie = response.headers.get("Set-Cookie")
        assert set_cookie is not None
        assert f"csrf={token}" in set_cookie
        assert "SameSite=Strict" in set_cookie or "samesite=strict" in set_cookie
        assert "Path=/" in set_cookie or "path=/" in set_cookie
        
        # Get another one and make sure it's different
        req2 = urllib.request.Request(f"{BASE_URL}/csrf")
        with urllib.request.urlopen(req2) as response2:
            data2 = json.loads(response2.read().decode("utf-8"))
            token2 = data2.get("token")
            assert token2 != token
            assert re.match(r"^[0-9a-f]{32}$", token2)
            
    print("✓ /csrf generation passed")
    return token, response.headers.get("Set-Cookie")

def test_write_without_csrf():
    print("Testing POST /api/comments without CSRF...")
    data = json.dumps({"author": "Alice", "text": "Hello world"}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/api/comments",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req)
        assert False, "Should have failed with 403"
    except urllib.error.HTTPError as e:
        assert e.code == 403
        resp_data = json.loads(e.read().decode("utf-8"))
        assert resp_data == {"error": "invalid_csrf_token"}
    print("✓ POST /api/comments without CSRF rejected correctly")

def test_write_with_mismatched_csrf(token):
    print("Testing POST /api/comments with mismatched CSRF...")
    data = json.dumps({"author": "Alice", "text": "Hello world"}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/api/comments",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Cookie": "csrf=mismatchedtokenmismatchedtoken32",
            "X-CSRF-Token": token
        }
    )
    try:
        urllib.request.urlopen(req)
        assert False, "Should have failed with 403"
    except urllib.error.HTTPError as e:
        assert e.code == 403
        resp_data = json.loads(e.read().decode("utf-8"))
        assert resp_data == {"error": "invalid_csrf_token"}
    print("✓ POST /api/comments with mismatched CSRF rejected correctly")

def test_write_with_valid_csrf_json(token):
    print("Testing POST /api/comments with valid JSON CSRF...")
    data = json.dumps({"author": "Alice", "text": "Hello world"}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/api/comments",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Cookie": f"csrf={token}",
            "X-CSRF-Token": token
        }
    )
    with urllib.request.urlopen(req) as response:
        assert response.status == 201
        resp_data = json.loads(response.read().decode("utf-8"))
        assert resp_data["author"] == "Alice"
        assert resp_data["text"] == "Hello world"
        assert isinstance(resp_data["id"], int)
        assert resp_data["id"] > 0
        comment_id = resp_data["id"]
    print("✓ POST /api/comments with valid JSON CSRF passed")
    return comment_id

def test_write_with_valid_csrf_form(token):
    print("Testing POST /api/comments with valid Form CSRF...")
    form_data = urllib.parse.urlencode({
        "author": "Bob",
        "text": "Hello form",
        "_csrf": token
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/api/comments",
        data=form_data,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": f"csrf={token}"
        }
    )
    with urllib.request.urlopen(req) as response:
        assert response.status == 201
        resp_data = json.loads(response.read().decode("utf-8"))
        assert resp_data["author"] == "Bob"
        assert resp_data["text"] == "Hello form"
        assert isinstance(resp_data["id"], int)
        assert resp_data["id"] > 0
        comment_id = resp_data["id"]
    print("✓ POST /api/comments with valid Form CSRF passed")
    return comment_id

def test_read_comments(expected_ids):
    print("Testing GET /api/comments...")
    req = urllib.request.Request(f"{BASE_URL}/api/comments")
    with urllib.request.urlopen(req) as response:
        assert response.status == 200
        data = json.loads(response.read().decode("utf-8"))
        assert isinstance(data, list)
        ids = [c["id"] for c in data]
        for eid in expected_ids:
            assert eid in ids
        # Check shape of comments
        for comment in data:
            assert "id" in comment
            assert "author" in comment
            assert "text" in comment
    print("✓ GET /api/comments passed")

if __name__ == "__main__":
    test_health()
    token, cookie_header = test_csrf_generation()
    test_write_without_csrf()
    test_write_with_mismatched_csrf(token)
    id1 = test_write_with_valid_csrf_json(token)
    id2 = test_write_with_valid_csrf_form(token)
    test_read_comments([id1, id2])
    print("\nALL TESTS PASSED SUCCESSFULLY!")
