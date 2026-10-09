"""Lector decide direccion (Pi >= 2.2 envia device_id) vs modo antiguo (alterna)."""
import os, sys, time
import requests
from dotenv import load_dotenv
from pymongo import MongoClient
sys.path.insert(0, '/app/backend')
load_dotenv('/app/backend/.env')
from qr_utils import generate_qr_data  # noqa: E402

db = MongoClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
URL = "http://localhost:8001/api/access/validate"
MID = "345518e1-a13e-4c9e-ad93-2fd62aa12f90"
GYM = "33562209-fdcc-42df-9fa7-fb4a5939214c"
TOK = "eOj7FRBkJe2gbE_TugB8gOJKSJYTWVYjnGomxwrIM2M"


def scan(direction, device_id=None):
    body = {"qr_code": generate_qr_data(MID, GYM, int(time.time())), "gym_token": TOK, "direction": direction}
    if device_id:
        body["device_id"] = device_id
    return requests.post(URL, json=body, timeout=10).json()


def age_last_log():
    """Envejece 60s todas las marcas del socio (evita el filtro de doble lectura, mantiene el orden)."""
    from datetime import datetime, timedelta
    for log in db.access_logs.find({"member_id": MID}):
        ts = datetime.fromisoformat(log["timestamp"]) - timedelta(seconds=60)
        db.access_logs.update_one({"_id": log["_id"]}, {"$set": {"timestamp": ts.isoformat()}})


def test_reader_decides_direction():
    backup = list(db.access_logs.find({"member_id": MID}))
    db.access_logs.delete_many({"member_id": MID})
    try:
        db.members.update_one({"id": MID}, {"$set": {"needs_first_entry": True}})
        r = scan("salida", "pi-1")  # socio nuevo en lector SALIDA con Pi nueva -> manda el lector
        assert r["valid"] and r["direction"] == "salida"
        assert not db.members.find_one({"id": MID}).get("needs_first_entry")
        assert scan("entrada", "pi-1").get("duplicate") is True  # doble lectura <10s
        age_last_log()
        assert scan("salida", "pi-1")["direction"] == "salida"  # salida tras salida: manda el lector
        age_last_log()
        assert scan("entrada", "pi-1")["direction"] == "entrada"
        age_last_log()
        assert scan("auto", "pi-1")["direction"] == "salida"  # lector unico (auto) -> alterna
        age_last_log()
        assert scan("entrada")["direction"] == "entrada"  # script antiguo (sin device_id) -> alterna
        age_last_log()
        assert scan("entrada")["direction"] == "salida"
        db.access_logs.delete_many({"member_id": MID})
        db.members.update_one({"id": MID}, {"$set": {"needs_first_entry": True}})
        assert scan("salida")["direction"] == "entrada"  # script antiguo + socio nuevo -> ENTRADA
    finally:
        db.access_logs.delete_many({"member_id": MID})
        if backup:
            db.access_logs.insert_many(backup)
        db.members.update_one({"id": MID}, {"$unset": {"needs_first_entry": ""}})
