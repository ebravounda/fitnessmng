"""Backend tests for Raspberry Pi monitor endpoints (device_management_routes)."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://health-pulse-338.preview.emergentagent.com").rstrip("/")

ADMIN_EMAIL = "info@gym24.es"
ADMIN_PASSWORD = "admin123"
TEST_DEVICE_ID = "fee8e8ca-57c3-4ab8-9d62-e58bd9299d3c"
TEST_GYM_ID = "33562209-fdcc-42df-9fa7-fb4a5939214c"
TEST_GYM_TOKEN = "eOj7FRBkJe2gbE_TugB8gOJKSJYTWVYjnGomxwrIM2M"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/admin/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, r.text
    tok = r.json().get("token") or r.json().get("access_token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Heartbeat ----------
class TestHeartbeat:
    def test_heartbeat_stores_telemetry(self):
        payload = {
            "gym_token": TEST_GYM_TOKEN,
            "local_ip": "192.168.1.77",
            "hostname": "rpi-test",
            "cpu_temp": 55.2,
            "cpu_usage": 12.5,
            "memory_usage": 44.0,
            "disk_usage": 30.0,
            "uptime": 123456,
            "wifi_signal": 55,
            "software_version": "1.0.0-test",
            "qr_readers": ["entrada", "salida"],
            "camera": "rpi-cam",
            "last_scan_at": "2026-01-10T12:00:00+00:00",
            "last_scan_result": "ok",
        }
        r = requests.post(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/heartbeat", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "ok"
        assert "command" in data

    def test_heartbeat_invalid_token(self):
        r = requests.post(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/heartbeat",
                          json={"gym_token": "WRONG_TOKEN_XXX"}, timeout=15)
        assert r.status_code == 401

    def test_heartbeat_missing_token(self):
        r = requests.post(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/heartbeat",
                          json={}, timeout=15)
        assert r.status_code == 401

    def test_heartbeat_unknown_device(self):
        r = requests.post(f"{BASE_URL}/api/devices/nonexistent-id-xyz/heartbeat",
                          json={"gym_token": TEST_GYM_TOKEN}, timeout=15)
        assert r.status_code == 404

    def test_heartbeat_wrong_gym_token(self, admin_headers):
        # Find another gym's token
        r = requests.get(f"{BASE_URL}/api/gyms", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        gyms = r.json()
        other = next((g for g in gyms if g.get("id") != TEST_GYM_ID and g.get("api_token")), None)
        if not other:
            pytest.skip("No other gym with api_token to test cross-tenant isolation")
        r = requests.post(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/heartbeat",
                          json={"gym_token": other["api_token"]}, timeout=15)
        assert r.status_code == 403


# ---------- Command sending ----------
class TestCommandSend:
    def test_send_invalid_command(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/command",
                          json={"command": "format_disk"}, headers=admin_headers, timeout=15)
        assert r.status_code == 400

    def test_send_without_auth(self):
        r = requests.post(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/command",
                          json={"command": "reboot"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_send_valid_command_and_pickup_and_result(self, admin_headers):
        # Drain any pending from previous runs by sending heartbeats until no cmd
        for _ in range(5):
            r = requests.post(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/heartbeat",
                              json={"gym_token": TEST_GYM_TOKEN}, timeout=15)
            if r.json().get("command") is None:
                break

        # Send test_video command
        r = requests.post(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/command",
                          json={"command": "test_video"}, headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        cmd = r.json()["command"]
        assert cmd["command"] == "test_video"
        assert cmd["status"] == "pending"
        cmd_id = cmd["id"]

        # Heartbeat should pick it up and mark delivered
        r = requests.post(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/heartbeat",
                          json={"gym_token": TEST_GYM_TOKEN}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("command") == "test_video"
        assert data.get("command_id") == cmd_id

        # Next heartbeat should NOT return it again
        r2 = requests.post(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/heartbeat",
                           json={"gym_token": TEST_GYM_TOKEN}, timeout=15)
        assert r2.json().get("command") in (None,)

        # Post command result
        r = requests.post(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/command-result",
                          json={"gym_token": TEST_GYM_TOKEN, "command_id": cmd_id,
                                "success": True, "output": "ok-video"}, timeout=15)
        assert r.status_code == 200

        # Verify stored via admin GET
        r = requests.get(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/commands",
                         headers=admin_headers, timeout=15)
        assert r.status_code == 200
        found = next((c for c in r.json() if c["id"] == cmd_id), None)
        assert found is not None
        assert found["status"] == "executed"
        assert found["output"] == "ok-video"

    def test_command_result_unknown_id(self):
        r = requests.post(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/command-result",
                          json={"gym_token": TEST_GYM_TOKEN, "command_id": "no-such-id",
                                "success": True, "output": "x"}, timeout=15)
        assert r.status_code == 404


# ---------- Status endpoint ----------
class TestDeviceStatus:
    def test_status_requires_super_admin(self):
        r = requests.get(f"{BASE_URL}/api/devices/status", timeout=15)
        assert r.status_code in (401, 403)

    def test_status_returns_devices(self, admin_headers):
        # heartbeat first to make it online
        requests.post(f"{BASE_URL}/api/devices/{TEST_DEVICE_ID}/heartbeat",
                      json={"gym_token": TEST_GYM_TOKEN, "local_ip": "192.168.1.77",
                            "software_version": "1.0.0-test"}, timeout=15)
        r = requests.get(f"{BASE_URL}/api/devices/status", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        devices = r.json()
        assert isinstance(devices, list)
        d = next((x for x in devices if x["id"] == TEST_DEVICE_ID), None)
        assert d is not None, "test device missing from /devices/status"
        assert d["computed_status"] == "online"
        assert d.get("seconds_since_ping") is not None
        assert d.get("gym_name")
        assert d.get("local_ip") == "192.168.1.77"
        assert "recent_commands" in d
        assert isinstance(d["recent_commands"], list)
        assert len(d["recent_commands"]) <= 5
        # No inactive devices
        for dev in devices:
            assert dev.get("active") is not False
