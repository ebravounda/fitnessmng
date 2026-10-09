"""Backend tests for Gym Admin manual door opening (iteration 33)."""
import os
import asyncio
import time
import threading
import requests
import pytest

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE}/api"
GYM_ID = "33562209-fdcc-42df-9fa7-fb4a5939214c"
DEVICE_ID = "002c930c-8505-4ece-810e-21472c98c727"
GYM_TOKEN = "eOj7FRBkJe2gbE_TugB8gOJKSJYTWVYjnGomxwrIM2M"

ADMIN = ("gymadmin.test@gym24.es", "test1234")
STAFF = ("staff.test@gym24.es", "test1234")
SUPER = ("info@gym24.es", "admin123")


def login(email, password):
    r = requests.post(f"{API}/auth/admin/login", json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_token():
    return login(*ADMIN)


@pytest.fixture(scope="module")
def staff_token():
    return login(*STAFF)


@pytest.fixture(scope="module")
def super_token():
    return login(*SUPER)


def h(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- GET /api/gym/doors ----------
def test_gym_doors_as_admin(admin_token):
    r = requests.get(f"{API}/gym/doors", headers=h(admin_token), timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 1
    d = next(x for x in data if x["id"] == DEVICE_ID)
    assert "computed_status" in d and d["computed_status"] in ("online", "offline")
    assert "instant" in d and isinstance(d["instant"], bool)


def test_gym_doors_as_staff(staff_token):
    r = requests.get(f"{API}/gym/doors", headers=h(staff_token), timeout=10)
    assert r.status_code == 200
    assert any(x["id"] == DEVICE_ID for x in r.json())


# ---------- Long-poll delivery -> near-instant open ----------
def _long_poll_once(result):
    try:
        r = requests.get(f"{API}/devices/{DEVICE_ID}/commands/wait",
                         params={"gym_token": GYM_TOKEN}, timeout=35)
        result["resp"] = r.json()
        result["status"] = r.status_code
    except Exception as e:
        result["err"] = str(e)


def test_open_entrada_delivered_via_long_poll(admin_token):
    result = {}
    t = threading.Thread(target=_long_poll_once, args=(result,))
    t.start()
    time.sleep(0.8)  # let the long poll start and set instant_at
    start = time.time()
    r = requests.post(f"{API}/gym/doors/{DEVICE_ID}/open",
                      headers=h(admin_token), json={"direction": "entrada"}, timeout=10)
    assert r.status_code == 200, r.text
    cmd_id = r.json()["command_id"]
    t.join(timeout=10)
    elapsed = time.time() - start
    assert result.get("status") == 200, result
    assert result["resp"]["command"] == "open_entrada"
    assert result["resp"]["command_id"] == cmd_id
    assert elapsed < 3.0, f"delivery too slow: {elapsed:.2f}s"

    # Report success -> executed
    rr = requests.post(f"{API}/devices/{DEVICE_ID}/command-result",
                       json={"gym_token": GYM_TOKEN, "command_id": cmd_id, "success": True, "output": "ok"},
                       timeout=10)
    assert rr.status_code == 200

    s = requests.get(f"{API}/gym/doors/commands/{cmd_id}", headers=h(admin_token), timeout=10).json()
    assert s["status"] == "executed"


def test_open_salida_as_staff(staff_token):
    result = {}
    t = threading.Thread(target=_long_poll_once, args=(result,))
    t.start()
    time.sleep(0.8)
    r = requests.post(f"{API}/gym/doors/{DEVICE_ID}/open",
                      headers=h(staff_token), json={"direction": "salida"}, timeout=10)
    assert r.status_code == 200
    cmd_id = r.json()["command_id"]
    t.join(timeout=10)
    assert result.get("resp", {}).get("command") == "open_salida"
    requests.post(f"{API}/devices/{DEVICE_ID}/command-result",
                  json={"gym_token": GYM_TOKEN, "command_id": cmd_id, "success": True}, timeout=10)


def test_invalid_direction(admin_token):
    r = requests.post(f"{API}/gym/doors/{DEVICE_ID}/open",
                      headers=h(admin_token), json={"direction": "diagonal"}, timeout=10)
    assert r.status_code == 400


def test_long_poll_bad_token():
    r = requests.get(f"{API}/devices/{DEVICE_ID}/commands/wait",
                     params={"gym_token": "wrong"}, timeout=10)
    assert r.status_code == 401


# ---------- Delivery exclusivity (heartbeat OR wait, not both) ----------
def test_command_not_delivered_twice(admin_token):
    # create a command without any consumer
    r = requests.post(f"{API}/gym/doors/{DEVICE_ID}/open",
                      headers=h(admin_token), json={"direction": "entrada"}, timeout=10)
    assert r.status_code == 200
    cmd_id = r.json()["command_id"]
    # heartbeat picks it
    hb = requests.post(f"{API}/devices/{DEVICE_ID}/heartbeat",
                       json={"gym_token": GYM_TOKEN}, timeout=10).json()
    assert hb.get("command_id") == cmd_id
    # a second consumer should NOT get it
    hb2 = requests.post(f"{API}/devices/{DEVICE_ID}/heartbeat",
                        json={"gym_token": GYM_TOKEN}, timeout=10).json()
    assert hb2.get("command_id") != cmd_id
    # mark executed to clean up
    requests.post(f"{API}/devices/{DEVICE_ID}/command-result",
                  json={"gym_token": GYM_TOKEN, "command_id": cmd_id, "success": True}, timeout=10)


# ---------- Expiration of unpicked manual command ----------
def test_manual_command_expires_after_60s(admin_token):
    """A command older than 60s with no consumer must become expired, not delivered."""
    import pymongo, uuid
    from datetime import datetime, timezone, timedelta
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url:
        pytest.skip("MONGO_URL not available in test env")
    client = pymongo.MongoClient(mongo_url)
    db = client[db_name]
    cid = str(uuid.uuid4())
    past = datetime.now(timezone.utc) - timedelta(seconds=120)
    db.device_commands.insert_one({
        "id": cid, "device_id": DEVICE_ID, "command": "open_entrada", "label": "manual",
        "status": "pending", "created_at": past.isoformat(),
        "expires_at": (past + timedelta(seconds=60)).isoformat(), "created_by": "test",
    })
    # polling once triggers expiration
    r = requests.get(f"{API}/gym/doors/commands/{cid}", headers=h(admin_token), timeout=10)
    assert r.status_code == 200
    assert r.json()["status"] == "expired"
    # Not delivered to a Pi now
    hb = requests.post(f"{API}/devices/{DEVICE_ID}/heartbeat",
                       json={"gym_token": GYM_TOKEN}, timeout=10).json()
    assert hb.get("command_id") != cid
    db.device_commands.delete_one({"id": cid})


# ---------- Access log + occupancy ----------
def test_manual_open_creates_access_log_and_increments_occupancy(admin_token):
    stats_before = requests.get(f"{API}/dashboard/stats", headers=h(admin_token), timeout=10).json()
    occ_before = stats_before.get("occupancy", {})
    entries_before = occ_before.get("entries_today", 0)

    # No consumer -> command stays pending; access log is still inserted at open time
    r = requests.post(f"{API}/gym/doors/{DEVICE_ID}/open",
                      headers=h(admin_token), json={"direction": "entrada"}, timeout=10)
    assert r.status_code == 200
    cmd_id = r.json()["command_id"]

    # drain pending to not leak
    requests.post(f"{API}/devices/{DEVICE_ID}/heartbeat",
                  json={"gym_token": GYM_TOKEN}, timeout=10)
    requests.post(f"{API}/devices/{DEVICE_ID}/command-result",
                  json={"gym_token": GYM_TOKEN, "command_id": cmd_id, "success": True}, timeout=10)

    stats_after = requests.get(f"{API}/dashboard/stats", headers=h(admin_token), timeout=10).json()
    occ_after = stats_after.get("occupancy", {})
    assert occ_after.get("entries_today", 0) == entries_before + 1

    # Access log present with manual flag
    logs = requests.get(f"{API}/access/logs?limit=20", headers=h(admin_token), timeout=10).json()
    rows = logs if isinstance(logs, list) else logs.get("logs", logs.get("items", []))
    found = next((l for l in rows if l.get("command_id") == cmd_id), None)
    assert found is not None, "manual open access_log missing"
    assert found.get("access_type") == "manual"
    assert found.get("is_manual") is True
    assert "Apertura manual" in (found.get("member_name") or "")
