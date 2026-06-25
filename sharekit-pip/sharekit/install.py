"""Download and cache the sharekit binary from GitHub Releases."""
import os
import stat
import sys
import urllib.request
from pathlib import Path

from . import __version__
from .platform import get_binary_name

CACHE_DIR = Path.home() / ".sharekit" / "bin"
RELEASE_BASE = "https://github.com/LucasSantana-Dev/sharekit/releases/download"


def ensure_binary() -> str:
    binary_name = get_binary_name()
    binary_path = CACHE_DIR / binary_name
    version_marker = CACHE_DIR / f".version-{__version__}"

    if binary_path.exists() and version_marker.exists() and os.access(binary_path, os.X_OK):
        return str(binary_path)

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    url = f"{RELEASE_BASE}/v{__version__}/{binary_name}"
    print(f"Downloading sharekit v{__version__}...", file=sys.stderr)
    try:
        urllib.request.urlretrieve(url, binary_path)
    except Exception as e:
        raise RuntimeError(f"Failed to download from {url}: {e}") from e

    if not sys.platform.startswith("win"):
        st = binary_path.stat()
        binary_path.chmod(st.st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)

    # Remove stale version markers and old binaries
    for old in CACHE_DIR.glob(".version-*"):
        if old.name != f".version-{__version__}":
            old.unlink(missing_ok=True)
    for old in CACHE_DIR.glob("sharekit*"):
        if old != binary_path and old.is_file():
            old.unlink(missing_ok=True)

    version_marker.touch()
    return str(binary_path)
