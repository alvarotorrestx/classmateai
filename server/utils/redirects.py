def is_safe_internal_redirect(value: str | None) -> bool:
    if not value:
        return False
    v = str(value).strip()
    if not v.startswith("/"):
        return False
    if v.startswith("//"):
        return False
    if "http://" in v or "https://" in v or "http:" in v or "https:" in v:
        return False
    return True

