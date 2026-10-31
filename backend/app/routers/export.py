from fastapi import APIRouter, HTTPException
from backend.app.models import ClipExportRequest
from backend.app.services.export_service import batch_export_scenes

router = APIRouter(prefix="/api/export", tags=["Export"])

@router.post("")
def export_clips(payload: ClipExportRequest):
    if not payload.scene_ids:
        raise HTTPException(status_code=400, detail="No scene_ids provided for export.")

    try:
        results = batch_export_scenes(
            scene_ids=payload.scene_ids,
            output_directory=payload.output_directory,
            resolution=payload.resolution,
            project_id=payload.project_id
        )
        return {
            "status": "completed",
            "count": len(results),
            "clips": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
