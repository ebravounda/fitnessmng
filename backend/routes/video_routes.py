from storage import write_file
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials
from datetime import datetime, timezone, timedelta
from typing import Optional
from pathlib import Path
import uuid
import logging
import os

from database import db
from auth import security, decode_jwt_token, get_current_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

# Video storage directory
VIDEO_DIR = Path("/opt/gym24/videos")
VIDEO_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/access/video")
async def upload_access_video(
    access_log_id: str = Form(...),
    gym_token: str = Form(...),
    video: UploadFile = File(...)
):
    """Raspberry Pi uploads a 4-second video clip after QR validation."""
    # Verify gym token
    gym = await db.gyms.find_one({"api_token": gym_token}, {"_id": 0})
    if not gym:
        raise HTTPException(status_code=401, detail="Invalid gym token")
    
    # Verify access log exists
    access_log = await db.access_logs.find_one({"id": access_log_id}, {"_id": 0})
    if not access_log:
        raise HTTPException(status_code=404, detail="Access log not found")
    
    # Save video file
    video_id = str(uuid.uuid4())
    filename = f"{video_id}.mp4"
    filepath = VIDEO_DIR / filename
    
    content = await video.read()
    if len(content) > 10 * 1024 * 1024:  # Max 10MB
        raise HTTPException(status_code=413, detail="Video too large (max 10MB)")
    
    write_file(filepath, content)
    
    # Update access log with video reference
    await db.access_logs.update_one(
        {"id": access_log_id},
        {"$set": {"video_id": video_id, "video_filename": filename}}
    )
    
    logger.info(f"Video uploaded: {filename} for access {access_log_id} ({len(content)} bytes)")
    return {"success": True, "video_id": video_id}


@router.get("/access/video/{video_id}")
async def get_access_video(video_id: str, token: Optional[str] = None, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Stream a video clip for admin viewing."""
    # Validate auth via header or query param
    auth_token = token or (credentials.credentials if credentials else None)
    if not auth_token:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    payload = decode_jwt_token(auth_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalido")
    
    filename = f"{video_id}.mp4"
    filepath = VIDEO_DIR / filename
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    
    return FileResponse(filepath, media_type="video/mp4", filename=filename)


@router.get("/access/videos")
async def list_access_videos(
    member_id: Optional[str] = None,
    gym_id: Optional[str] = None,
    limit: int = 50,
    admin: dict = Depends(get_current_admin)
):
    """List access logs that have video recordings."""
    query = {"video_id": {"$exists": True, "$ne": None}}
    
    if admin["role"] != "super_admin":
        query["gym_id"] = admin.get("gym_id")
    elif gym_id:
        query["gym_id"] = gym_id
    
    if member_id:
        query["member_id"] = member_id
    
    logs = await db.access_logs.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return logs


@router.delete("/access/videos/cleanup")
async def cleanup_old_videos(admin: dict = Depends(get_current_admin)):
    """Delete videos older than 30 days. Can be called manually or via cron."""
    if admin["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Solo super admin")
    
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    old_logs = await db.access_logs.find(
        {"video_id": {"$exists": True}, "timestamp": {"$lt": cutoff}},
        {"_id": 0, "video_id": 1, "video_filename": 1}
    ).to_list(10000)
    
    deleted_count = 0
    for log in old_logs:
        filepath = VIDEO_DIR / log.get("video_filename", "")
        if filepath.exists():
            os.remove(filepath)
            deleted_count += 1
    
    # Remove video references from access logs
    await db.access_logs.update_many(
        {"video_id": {"$exists": True}, "timestamp": {"$lt": cutoff}},
        {"$unset": {"video_id": "", "video_filename": ""}}
    )
    
    logger.info(f"Cleanup: deleted {deleted_count} videos older than 30 days")
    return {"deleted": deleted_count}
