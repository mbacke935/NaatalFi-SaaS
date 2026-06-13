ALLOWED_IMAGE_TYPES = {
    'image/jpeg': ('jpg', 'jpeg'),
    'image/png': ('png',),
    'image/webp': ('webp',),
}

MAX_IMAGE_SIZE = 5 * 1024 * 1024


def _matches_magic(content_type, header):
    if content_type == 'image/jpeg':
        return header.startswith(b'\xff\xd8\xff')
    if content_type == 'image/png':
        return header.startswith(b'\x89PNG\r\n\x1a\n')
    if content_type == 'image/webp':
        return len(header) >= 12 and header[:4] == b'RIFF' and header[8:12] == b'WEBP'
    return False


def validate_uploaded_image(file):
    content_type = (getattr(file, 'content_type', '') or '').lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        return 'Format non supporte (JPG, PNG, WebP).'

    if getattr(file, 'size', 0) > MAX_IMAGE_SIZE:
        return 'Fichier trop volumineux (max 5 Mo).'

    position = file.tell() if hasattr(file, 'tell') else None
    header = file.read(32)
    if position is not None and hasattr(file, 'seek'):
        file.seek(position)

    if not _matches_magic(content_type, header):
        return 'Le fichier fourni ne correspond pas a une image valide.'

    return ''
