import uuid
import requests
from django.conf import settings


def upload_to_supabase(file, bucket: str, folder: str = '') -> str:
    """Upload a file to Supabase Storage. Returns the public URL."""
    supabase_url = getattr(settings, 'SUPABASE_URL', '')
    service_key = getattr(settings, 'SUPABASE_SERVICE_ROLE_KEY', '')

    if not supabase_url or not service_key:
        raise ValueError(
            "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env"
        )

    ext = file.name.rsplit('.', 1)[-1].lower()
    filename = f"{folder}/{uuid.uuid4()}.{ext}" if folder else f"{uuid.uuid4()}.{ext}"

    response = requests.post(
        f"{supabase_url}/storage/v1/object/{bucket}/{filename}",
        headers={
            'Authorization': f"Bearer {service_key}",
            'Content-Type': file.content_type or 'application/octet-stream',
        },
        data=file.read(),
        timeout=30,
    )
    response.raise_for_status()

    return f"{supabase_url}/storage/v1/object/public/{bucket}/{filename}"
