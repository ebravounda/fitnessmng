from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import Optional, List
from datetime import datetime, timezone
from pathlib import Path
import uuid, os, logging

from database import db
from auth import get_current_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

CLASSES_VIDEO_DIR = Path("/app/uploads/classes")
CLASSES_VIDEO_DIR.mkdir(parents=True, exist_ok=True)

# ============ ONLINE CLASSES ============

@router.post("/online-classes")
async def create_online_class(
    title: str = Form(...),
    description: str = Form(""),
    category: str = Form("general"),
    duration_minutes: int = Form(0),
    assigned_to: str = Form("all"),
    video: UploadFile = File(...),
    admin: dict = Depends(get_current_admin)
):
    gym_id = admin.get("gym_id")
    if not gym_id and admin["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="No gym assigned")

    video_id = str(uuid.uuid4())
    ext = video.filename.split(".")[-1] if "." in video.filename else "mp4"
    filename = f"{video_id}.{ext}"
    filepath = CLASSES_VIDEO_DIR / filename

    content = await video.read()
    if len(content) > 500 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Video demasiado grande (max 500MB)")

    with open(filepath, "wb") as f:
        f.write(content)

    # assigned_to: "all" or comma-separated member IDs
    member_ids = [] if assigned_to == "all" else [mid.strip() for mid in assigned_to.split(",") if mid.strip()]

    doc = {
        "id": video_id, "gym_id": gym_id, "title": title,
        "description": description, "category": category,
        "duration_minutes": duration_minutes,
        "assigned_to": assigned_to,
        "member_ids": member_ids,
        "video_filename": filename, "video_size": len(content),
        "created_by": admin.get("id"), "created_at": datetime.now(timezone.utc).isoformat(),
        "active": True
    }
    await db.online_classes.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.get("/online-classes")
async def list_online_classes(gym_id: Optional[str] = None, member_id: Optional[str] = None):
    query = {"active": True}
    if gym_id:
        query["gym_id"] = gym_id
    classes = await db.online_classes.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Filter by member if specified
    if member_id:
        classes = [c for c in classes if c.get("assigned_to") == "all" or member_id in c.get("member_ids", [])]
    
    return classes

@router.get("/online-classes/{class_id}/video")
async def stream_online_class(class_id: str):
    doc = await db.online_classes.find_one({"id": class_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    filepath = CLASSES_VIDEO_DIR / doc["video_filename"]
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Video no encontrado")
    return FileResponse(filepath, media_type="video/mp4")

@router.delete("/online-classes/{class_id}")
async def delete_online_class(class_id: str, admin: dict = Depends(get_current_admin)):
    doc = await db.online_classes.find_one({"id": class_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    filepath = CLASSES_VIDEO_DIR / doc.get("video_filename", "")
    if filepath.exists():
        os.remove(filepath)
    await db.online_classes.delete_one({"id": class_id})
    return {"success": True}

@router.post("/online-classes/youtube")
async def create_youtube_class(body: dict, admin: dict = Depends(get_current_admin)):
    """Create an online class from a YouTube link."""
    gym_id = admin.get("gym_id")
    if not gym_id and admin["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="No gym assigned")
    
    youtube_url = body.get("youtube_url", "")
    if not youtube_url:
        raise HTTPException(status_code=400, detail="URL de YouTube requerida")
    
    # Extract YouTube video ID
    video_yt_id = ""
    if "youtu.be/" in youtube_url:
        video_yt_id = youtube_url.split("youtu.be/")[-1].split("?")[0]
    elif "v=" in youtube_url:
        video_yt_id = youtube_url.split("v=")[-1].split("&")[0]
    elif "embed/" in youtube_url:
        video_yt_id = youtube_url.split("embed/")[-1].split("?")[0]
    
    assigned_to = body.get("assigned_to", "all")
    member_ids = [] if assigned_to == "all" else [mid.strip() for mid in assigned_to.split(",") if mid.strip()]

    doc = {
        "id": str(uuid.uuid4()), "gym_id": gym_id,
        "title": body.get("title", ""),
        "description": body.get("description", ""),
        "category": body.get("category", "general"),
        "duration_minutes": body.get("duration_minutes", 0),
        "source": "youtube",
        "youtube_url": youtube_url,
        "youtube_id": video_yt_id,
        "assigned_to": assigned_to,
        "member_ids": member_ids,
        "video_filename": "", "video_size": 0,
        "created_by": admin.get("id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "active": True
    }
    await db.online_classes.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ============ CUSTOM EXERCISES ============

@router.get("/exercises/custom")
async def get_custom_exercises(gym_id: Optional[str] = None):
    query = {}
    if gym_id:
        query["gym_id"] = gym_id
    exercises = await db.custom_exercises.find(query, {"_id": 0}).sort("muscle_group", 1).to_list(500)
    return exercises

@router.post("/exercises/custom")
async def create_custom_exercise(body: dict, admin: dict = Depends(get_current_admin)):
    gym_id = admin.get("gym_id")
    doc = {
        "id": str(uuid.uuid4()), "gym_id": gym_id,
        "muscle_group": body.get("muscle_group", ""),
        "name": body.get("name", ""),
        "machine": body.get("machine", ""),
        "series": body.get("series", 3),
        "reps": body.get("reps", "12"),
        "description": body.get("description", ""),
        "image_url": body.get("image_url", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.custom_exercises.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.put("/exercises/custom/{exercise_id}")
async def update_custom_exercise(exercise_id: str, body: dict, admin: dict = Depends(get_current_admin)):
    updates = {k: v for k, v in body.items() if k in ["name", "machine", "series", "reps", "description", "muscle_group", "image_url"]}
    await db.custom_exercises.update_one({"id": exercise_id}, {"$set": updates})
    return {"success": True}

@router.delete("/exercises/custom/{exercise_id}")
async def delete_custom_exercise(exercise_id: str, admin: dict = Depends(get_current_admin)):
    await db.custom_exercises.delete_one({"id": exercise_id})
    return {"success": True}
