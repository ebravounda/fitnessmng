import asyncio

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import uuid

from database import db
from auth import get_current_admin, check_role

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
MANUAL_OPEN_EXPIRE_SECONDS = 60  # una apertura manual tardia nunca se ejecuta
LONG_POLL_SECONDS = 25
GYM_STAFF_ROLES = ["super_admin", "gym_admin", "gym_manager"]
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
    now = datetime.now(timezone.utc)
    limit = (now - timedelta(minutes=COMMAND_EXPIRE_MINUTES)).isoformat()
    await db.device_commands.update_many(
        {"device_id": device_id, "status": "pending",
         "$or": [{"created_at": {"$lt": limit}}, {"expires_at": {"$lt": now.isoformat()}}]},
        {"$set": {"status": "expired", "output": "La Raspberry no recogio el comando a tiempo"}},
    )


async def _pop_pending_command(device_id: str) -> dict | None:
    """Entrega atomica: un comando nunca se ejecuta dos veces (heartbeat + long-poll)."""
    await _expire_old_commands(device_id)
    return await db.device_commands.find_one_and_update(
        {"device_id": device_id, "status": "pending"},
        {"$set": {"status": "delivered", "delivered_at": datetime.now(timezone.utc).isoformat()}},
        sort=[("created_at", 1)], projection={"_id": 0},
    )


def _command_payload(cmd: dict | None) -> dict:
    if not cmd:
        return {"status": "ok", "command": None}
    return {"status": "ok", "command": cmd["command"], "command_id": cmd["id"]}


def _with_status(d: dict, now: datetime) -> dict:
    d["computed_status"], d["seconds_since_ping"] = "offline", None
    if d.get("last_ping"):
        diff = (now - datetime.fromisoformat(d["last_ping"].replace("Z", "+00:00"))).total_seconds()
        d["computed_status"] = "online" if diff < 120 else "offline"
        d["seconds_since_ping"] = int(diff)
    instant = d.get("instant_at")
    d["instant"] = bool(instant) and (now - datetime.fromisoformat(instant)).total_seconds() < 60
    return d


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
    return _command_payload(await _pop_pending_command(device_id))


@router.get("/devices/{device_id}/commands/wait")
async def device_wait_command(device_id: str, gym_token: str):
    """Long-poll (Pi >= 2.4): responde en cuanto hay un comando -> apertura casi instantanea."""
    await _get_device_for_token(device_id, gym_token)
    now = datetime.now(timezone.utc).isoformat()
    await db.devices.update_one({"id": device_id}, {"$set": {"instant_at": now, "last_ping": now, "status": "online"}})
    loop = asyncio.get_running_loop()
    deadline = loop.time() + LONG_POLL_SECONDS
    while loop.time() < deadline:
        cmd = await _pop_pending_command(device_id)
        if cmd:
            return _command_payload(cmd)
        await asyncio.sleep(0.3)
    return _command_payload(None)


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

class DoorOpenRequest(BaseModel):
    direction: str


@router.get("/gym/doors")
async def get_gym_doors(admin: dict = Depends(get_current_admin)):
    """Tornos (Raspberry) del gimnasio del admin/staff para apertura manual."""
    check_role(admin, GYM_STAFF_ROLES)
    if not admin.get("gym_id"):
        return []
    devices = await db.devices.find(
        {"gym_id": admin["gym_id"], "active": {"$ne": False}},
        {"_id": 0, "id": 1, "name": 1, "last_ping": 1, "instant_at": 1, "software_version": 1},
    ).to_list(length=None)
    now = datetime.now(timezone.utc)
    return [_with_status(d, now) for d in devices]


@router.post("/gym/doors/{device_id}/open")
async def open_gym_door(device_id: str, req: DoorOpenRequest, admin: dict = Depends(get_current_admin)):
    if req.direction not in ("entrada", "salida"):
        raise HTTPException(status_code=400, detail="Direccion no valida")
    device = await db.devices.find_one({"id": device_id, "active": {"$ne": False}}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    check_role(admin, GYM_STAFF_ROLES, device.get("gym_id"))
    now = datetime.now(timezone.utc)
    who = admin.get("name") or admin.get("email", "")
    cmd = {
        "id": str(uuid.uuid4()), "device_id": device_id, "command": f"open_{req.direction}",
        "label": ALLOWED_COMMANDS[f"open_{req.direction}"], "status": "pending",
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(seconds=MANUAL_OPEN_EXPIRE_SECONDS)).isoformat(),
        "created_by": admin.get("email", admin["id"]),
    }
    await db.device_commands.insert_one(cmd)
    # Cuenta en el aforo (entradas - salidas del dia)
    await db.access_logs.insert_one({
        "id": str(uuid.uuid4()), "gym_id": device.get("gym_id"), "member_id": None,
        "member_name": f"Apertura manual ({who})", "direction": req.direction,
        "access_type": "manual", "is_manual": True, "is_guest": False,
        "opened_by": admin["id"], "opened_by_name": who, "device_id": device_id,
        "command_id": cmd["id"], "timestamp": now.isoformat(),
    })
    return {"command_id": cmd["id"], "status": "pending"}


@router.get("/gym/doors/commands/{command_id}")
async def get_gym_door_command(command_id: str, admin: dict = Depends(get_current_admin)):
    cmd = await db.device_commands.find_one({"id": command_id}, {"_id": 0})
    if not cmd:
        raise HTTPException(status_code=404, detail="Comando no encontrado")
    device = await db.devices.find_one({"id": cmd["device_id"]}, {"_id": 0, "gym_id": 1})
    check_role(admin, GYM_STAFF_ROLES, (device or {}).get("gym_id"))
    if cmd["status"] == "pending" and cmd.get("expires_at") and cmd["expires_at"] < datetime.now(timezone.utc).isoformat():
        cmd["status"] = "expired"
    return {"id": cmd["id"], "status": cmd["status"], "output": cmd.get("output")}


@router.get("/devices/status")
async def get_devices_status(admin: dict = Depends(get_current_admin)):
    if admin["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Solo super admin")
    devices = await db.devices.find({"active": {"$ne": False}}, {"_id": 0}).to_list(length=None)
    now = datetime.now(timezone.utc)
    for d in devices:
        _with_status(d, now)
        gym = await db.gyms.find_one({"id": d.get("gym_id")}, {"_id": 0, "name": 1})
        d["gym_name"] = gym.get("name", "Desconocido") if gym else "Desconocido"
        await _expire_old_commands(d["id"])
        d["recent_commands"] = await db.device_commands.find(
            {"device_id": d["id"]}, {"_id": 0}
        ).sort("created_at", -1).to_list(5)
    return devices
