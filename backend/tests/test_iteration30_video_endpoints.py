"""
Iteration 30 - Video recording endpoints (Raspberry Pi upload + admin viewing)
Tests the complete backend video pipeline:
- POST /api/access/video: Raspberry Pi uploads MP4 associated to an access_log_id
- GET /api/access/video/{video_id}: Admin retrieves the video (streaming)
- GET /api/access/videos: Admin lists access logs that have videos
- DELETE /api/access/videos/cleanup: Manual cleanup of videos > 30 days
- Verifies also cleanup task/logic (do_cleanup_old_videos) via manual endpoint
"""
import os
import sys
import io
import time
import uuid
import pytest
import requests

# Make backend importable for qr_utils
sys.path.insert(0, "/app/backend")
from qr_utils import generate_qr_data  # noqa: E402

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://health-pulse-338.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "info@gym24.es"
ADMIN_PASSWORD = "admin123"

# ---- minimal valid MP4 (small container that FastAPI happily accepts) ----
# 32 bytes ftyp + 8 bytes moov box header. Enough for a valid MP4 file signature.
MP4_BYTES = (
    b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2avc1mp41"
    b"\x00\x00\x00\x08moov"
    + b"\x00" * 2048  # padding
)


# ------------------------- Fixtures -------------------------
@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def gym_info(admin_headers):
    """Return first gym's id and api_token, or create one if none exists."""
    r = requests.get(f"{API}/gyms", headers=admin_headers, timeout=15)
    assert r.status_code == 200, f"List gyms failed: {r.text}"
    gyms = r.json()
    if not gyms:
        pytest.skip("No gyms in preview DB - cannot test video pipeline")
    g = gyms[0]
    assert g.get("api_token"), f"Gym has no api_token: {g}"
    return {"id": g["id"], "api_token": g["api_token"], "name": g.get("name")}


@pytest.fixture(scope="module")
def active_member(admin_headers, gym_info):
    """Return an active member with active membership in the gym."""
    r = requests.get(f"{API}/members?gym_id={gym_info['id']}", headers=admin_headers, timeout=15)
    assert r.status_code == 200, r.text
    members = r.json()
    active = [m for m in members if m.get("status") == "active"]
    if not active:
        pytest.skip("No active member in gym - cannot test QR->access_log->video flow")
    # find one with active membership
    for m in active:
        rm = requests.get(f"{API}/memberships?member_id={m['id']}", headers=admin_headers, timeout=15)
        if rm.status_code == 200 and any(x.get("status") == "active" for x in rm.json()):
            return m
    pytest.skip("No active member with active membership found")


@pytest.fixture(scope="module")
def access_log_id(gym_info, active_member):
    """Create a real access_log by calling POST /api/access/validate with a valid QR."""
    ts = int(time.time())
    qr_code = generate_qr_data(active_member["id"], gym_info["id"], ts)
    r = requests.post(f"{API}/access/validate", json={
        "qr_code": qr_code,
        "gym_token": gym_info["api_token"],
        "direction": "entrada",
    }, timeout=15)
    assert r.status_code == 200, f"validate failed: {r.text}"
    data = r.json()
    assert data.get("valid") is True, f"QR validation not valid: {data}"
    assert data.get("access_log_id"), f"No access_log_id returned: {data}"
    return data["access_log_id"]


# ------------------------- Tests -------------------------

# Feature: POST /api/access/video (Raspberry Pi upload)
class TestVideoUpload:

    def test_upload_video_success(self, gym_info, access_log_id):
        files = {"video": ("clip.mp4", io.BytesIO(MP4_BYTES), "video/mp4")}
        data = {"access_log_id": access_log_id, "gym_token": gym_info["api_token"]}
        r = requests.post(f"{API}/access/video", data=data, files=files, timeout=30)
        assert r.status_code == 200, f"upload failed: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("success") is True
        assert body.get("video_id"), f"No video_id returned: {body}"
        # persist for downstream tests via module-level dict
        pytest.video_id = body["video_id"]

    def test_upload_video_invalid_gym_token(self, access_log_id):
        files = {"video": ("clip.mp4", io.BytesIO(MP4_BYTES), "video/mp4")}
        data = {"access_log_id": access_log_id, "gym_token": "invalid-token-xxx"}
        r = requests.post(f"{API}/access/video", data=data, files=files, timeout=15)
        assert r.status_code == 401, f"Expected 401 for bad gym_token: {r.status_code} {r.text}"

    def test_upload_video_invalid_access_log(self, gym_info):
        files = {"video": ("clip.mp4", io.BytesIO(MP4_BYTES), "video/mp4")}
        data = {"access_log_id": "nonexistent-access-log-id", "gym_token": gym_info["api_token"]}
        r = requests.post(f"{API}/access/video", data=data, files=files, timeout=15)
        assert r.status_code == 404, f"Expected 404 for bad access_log_id: {r.status_code} {r.text}"

    def test_upload_video_too_large(self, gym_info, access_log_id):
        big = b"\x00" * (11 * 1024 * 1024)  # 11MB > 10MB limit
        files = {"video": ("big.mp4", io.BytesIO(big), "video/mp4")}
        data = {"access_log_id": access_log_id, "gym_token": gym_info["api_token"]}
        r = requests.post(f"{API}/access/video", data=data, files=files, timeout=60)
        assert r.status_code == 413, f"Expected 413 for oversize: {r.status_code} {r.text}"

    def test_upload_persists_video_reference_on_access_log(self, admin_headers, access_log_id):
        # Verify the access_log now has video_id / video_filename
        r = requests.get(f"{API}/access/logs?limit=1000", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        logs = r.json()
        matched = next((l for l in logs if l.get("id") == access_log_id), None)
        assert matched is not None, f"access_log {access_log_id} not returned"
        assert matched.get("video_id"), f"access_log missing video_id: {matched}"
        assert matched.get("video_filename", "").endswith(".mp4")


# Feature: GET /api/access/video/{video_id}
class TestVideoDownload:

    def test_get_video_success_bearer_header(self, admin_headers):
        video_id = getattr(pytest, "video_id", None)
        assert video_id, "video_id must be set from upload test"
        r = requests.get(f"{API}/access/video/{video_id}", headers=admin_headers, timeout=15)
        assert r.status_code == 200, f"download failed: {r.status_code} {r.text[:200]}"
        assert r.headers.get("content-type", "").startswith("video/mp4")
        assert len(r.content) == len(MP4_BYTES), f"video byte size mismatch: got {len(r.content)} vs {len(MP4_BYTES)}"

    def test_get_video_success_query_token(self, admin_token):
        video_id = getattr(pytest, "video_id", None)
        assert video_id
        r = requests.get(f"{API}/access/video/{video_id}?token={admin_token}", timeout=15)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("video/mp4")

    def test_get_video_no_auth(self):
        video_id = getattr(pytest, "video_id", None)
        assert video_id
        r = requests.get(f"{API}/access/video/{video_id}", timeout=15)
        # 401 (our detail) or 403 (HTTPBearer default) both valid auth denial
        assert r.status_code in (401, 403), f"Expected 401/403 without auth, got {r.status_code}"

    def test_get_video_invalid_token(self):
        video_id = getattr(pytest, "video_id", None)
        assert video_id
        # Try with Authorization header so HTTPBearer accepts and our decode_jwt_token check runs
        r = requests.get(f"{API}/access/video/{video_id}", headers={"Authorization": "Bearer invalidjwt"}, timeout=15)
        assert r.status_code == 401, f"Expected 401 for invalid token, got {r.status_code}"

    def test_get_video_not_found(self, admin_headers):
        r = requests.get(f"{API}/access/video/{uuid.uuid4()}", headers=admin_headers, timeout=15)
        assert r.status_code == 404


# Feature: GET /api/access/videos (list access logs with videos)
class TestVideoList:

    def test_list_videos_super_admin(self, admin_headers, access_log_id):
        r = requests.get(f"{API}/access/videos", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        arr = r.json()
        assert isinstance(arr, list)
        # our created access_log should appear
        ids = [x.get("id") for x in arr]
        assert access_log_id in ids, f"access_log {access_log_id} not in list: first ids={ids[:5]}"
        # every element must have video_id
        for item in arr:
            assert item.get("video_id"), f"item without video_id: {item}"
            assert "_id" not in item, "MongoDB _id must be excluded"

    def test_list_videos_filter_by_member(self, admin_headers, active_member):
        r = requests.get(f"{API}/access/videos?member_id={active_member['id']}", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        for item in r.json():
            assert item.get("member_id") == active_member["id"]

    def test_list_videos_requires_auth(self):
        r = requests.get(f"{API}/access/videos", timeout=15)
        assert r.status_code in (401, 403), f"Expected 401/403 without auth, got {r.status_code}"


# Feature: DELETE /api/access/videos/cleanup (manual cleanup + do_cleanup_old_videos logic parity)
class TestVideoCleanup:

    def test_cleanup_endpoint_super_admin(self, admin_headers):
        r = requests.delete(f"{API}/access/videos/cleanup", headers=admin_headers, timeout=30)
        assert r.status_code == 200, f"cleanup failed: {r.status_code} {r.text}"
        body = r.json()
        assert "deleted" in body
        assert isinstance(body["deleted"], int)
        assert body["deleted"] >= 0
        # Recently uploaded video (just now) MUST NOT be deleted
        video_id = getattr(pytest, "video_id", None)
        if video_id:
            r2 = requests.get(f"{API}/access/video/{video_id}", headers=admin_headers, timeout=15)
            assert r2.status_code == 200, "Fresh video was wrongly deleted by cleanup"

    def test_cleanup_requires_auth(self):
        r = requests.delete(f"{API}/access/videos/cleanup", timeout=15)
        assert r.status_code in (401, 403)


# Feature: do_cleanup_old_videos direct call (validates the cron function logic works)
class TestCleanupCronFunction:

    def test_do_cleanup_old_videos_callable(self):
        """Directly execute the cron function and validate it runs without error."""
        import asyncio
        sys.path.insert(0, "/app/backend")
        from server import do_cleanup_old_videos  # noqa: E402
        # should not raise
        asyncio.get_event_loop().run_until_complete(do_cleanup_old_videos())
