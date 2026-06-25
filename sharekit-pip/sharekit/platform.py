"""Platform detection and binary name mapping."""
import sys
import platform


def get_platform() -> str:
    system = sys.platform
    machine = platform.machine().lower()

    if system == "darwin":
        if machine in ("arm64", "aarch64"):
            return "macos-arm64"
        if machine in ("x86_64", "amd64"):
            return "macos-x64"
    elif system == "linux":
        if machine in ("x86_64", "amd64"):
            return "linux-x64"
        if machine in ("aarch64", "arm64"):
            return "linux-arm64"
    elif system == "win32":
        if machine in ("amd64", "x86_64"):
            return "windows-x64"

    raise RuntimeError(
        f"sharekit has no prebuilt binary for {system}/{machine}. "
        "See: https://github.com/LucasSantana-Dev/sharekit"
    )


def get_binary_name() -> str:
    suffix = get_platform()
    return f"sharekit-{suffix}.exe" if suffix.startswith("windows") else f"sharekit-{suffix}"
