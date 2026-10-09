from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
import uuid

from database import db
from auth import get_current_admin

router = APIRouter(prefix="/api")

# ==================== DEVICE HEARTBEAT (called by Raspberry Pi) ====================

ALLOWED_COMMANDS = {
    "reboot": "Reiniciar Raspberry",
    "restart_service": "Reiniciar servicio",
    "open_entrada": "Abrir torno ENTRADA",
    "open_salida": "Abrir torno SALIDA",
    "test_video": "Grabar video de prueba",
}
COMMAND_EXPIRE_MINUTES = 10
TELEMETRY_FIELDS = [
    "local_ip", "hostname", "cpu_temp", "cpu_usage", "memory_usage", "disk_usage",
    "uptime", "wifi_signal", "software_version", "qr_readers", "camera",
    "last_scan_at", "last_scan_result", "invert_readers", "invert_relays",
]


async def _get_device_for_token(device_id: str, gym_token: str | None) -> dict:
    if not gym_token:
        raise HTTPException(status_code=401, detail="Token requerido")
    gym = await db.gyms.find_one({"api_token": gym_token}, {"_id": 0, "id": 1})
    if not gym:
        raise HTTPException(status_code=401, detail="Token invalido")
    device = await db.devices.find_one({"id": device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    if device.get("gym_id") and device["gym_id"] != gym["id"]:
        raise HTTPException(status_code=403, detail="Dispositivo no pertenece a este gimnasio")
    return device


async def _expire_old_commands(device_id: str) -> None:
    limit = (datetime.now(timezone.utc) - timedelta(minutes=COMMAND_EXPIRE_MINUTES)).isoformat()
    await db.device_commands.update_many(
        {"device_id": device_id, "status": "pending", "created_at": {"$lt": limit}},
        {"$set": {"status": "expired", "output": "La Raspberry no recogio el comando a tiempo"}},
    )


@router.post("/devices/{device_id}/heartbeat")
async def device_heartbeat(device_id: str, request: Request):
    body = await request.json()
    await _get_device_for_token(device_id, body.get("gym_token"))
    now = datetime.now(timezone.utc).isoformat()
    forwarded = request.headers.get("x-forwarded-for", "")
    public_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "")
    update = {"status": "online", "last_ping": now, "ip_address": public_ip}
    update.update({f: body.get(f) for f in TELEMETRY_FIELDS if f in body})
    await db.devices.update_one({"id": device_id}, {"$set": update})
    await _expire_old_commands(device_id)
    pending_cmd = await db.device_commands.find_one(
        {"device_id": device_id, "status": "pending"}, {"_id": 0}, sort=[("created_at", 1)]
    )
    if not pending_cmd:
        return {"status": "ok", "command": None}
    await db.device_commands.update_one(
        {"id": pending_cmd["id"]}, {"$set": {"status": "delivered", "delivered_at": now}}
    )
    return {"status": "ok", "command": pending_cmd["command"], "command_id": pending_cmd["id"]}


@router.post("/devices/{device_id}/command-result")
async def device_command_result(device_id: str, request: Request):
    body = await request.json()
    await _get_device_for_token(device_id, body.get("gym_token"))
    result = await db.device_commands.update_one(
        {"id": body.get("command_id"), "device_id": device_id},
        {"$set": {
            "status": "executed" if body.get("success") else "failed",
            "output": str(body.get("output", ""))[:500],
            "executed_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Comando no encontrado")
    return {"status": "ok"}

# ==================== REMOTE COMMANDS (Admin) ====================

@router.post("/devices/{device_id}/command")
async def send_device_command(device_id: str, request: Request, admin: dict = Depends(get_current_admin)):
    if admin["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Solo super admin")
    body = await request.json()
    command = body.get("command")
    if command not in ALLOWED_COMMANDS:
        raise HTTPException(status_code=400, detail=f"Comando no valido. Usa: {', '.join(ALLOWED_COMMANDS)}")
    device = await db.devices.find_one({"id": device_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    cmd = {
        "id": str(uuid.uuid4()),
        "device_id": device_id,
        "command": command,
        "label": ALLOWED_COMMANDS[command],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin.get("email", admin["id"]),
    }
    await db.device_commands.insert_one(cmd)
    cmd.pop("_id", None)
    return {"message": f"Comando '{ALLOWED_COMMANDS[command]}' enviado", "command": cmd}

@router.get("/devices/{device_id}/commands")
async def get_device_commands(device_id: str, admin: dict = Depends(get_current_admin)):
    if admin["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Solo super admin")
    commands = await db.device_commands.find(
        {"device_id": device_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return commands

@router.get("/devices/status")
async def get_devices_status(admin: dict = Depends(get_current_admin)):
    if admin["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Solo super admin")
    devices = await db.devices.find({"active": {"$ne": False}}, {"_id": 0}).to_list(length=None)
    now = datetime.now(timezone.utc)
    for d in devices:
        if d.get("last_ping"):
            try:
                last = datetime.fromisoformat(d["last_ping"].replace("Z", "+00:00"))
                diff = (now - last).total_seconds()
                d["computed_status"] = "online" if diff < 120 else "offline"
                d["seconds_since_ping"] = int(diff)
            except Exception:
                d["computed_status"] = "offline"
                d["seconds_since_ping"] = None
        else:
            d["computed_status"] = "offline"
            d["seconds_since_ping"] = None
        gym = await db.gyms.find_one({"id": d.get("gym_id")}, {"_id": 0, "name": 1})
        d["gym_name"] = gym.get("name", "Desconocido") if gym else "Desconocido"
        await _expire_old_commands(d["id"])
        d["recent_commands"] = await db.device_commands.find(
            {"device_id": d["id"]}, {"_id": 0}
        ).sort("created_at", -1).to_list(5)
    return devices
