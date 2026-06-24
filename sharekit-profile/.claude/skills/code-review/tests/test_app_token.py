"""Unit tests for app_token.py — GitHub App installation-token minting (stdlib + openssl).

Run: python3 -m pytest tests/ -q   (or: python3 tests/test_app_token.py)
"""
import base64
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import app_token as at  # noqa: E402

HAS_OPENSSL = shutil.which("openssl") is not None


def _b64url_decode(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def test_b64url_strips_padding_and_is_urlsafe():
    raw = bytes(range(64))  # spans bytes that map to + and / in standard base64
    out = at.b64url(raw)
    assert "=" not in out and "+" not in out and "/" not in out
    assert _b64url_decode(out) == raw  # round-trips with padding restored


def _gen_rsa_key():
    fd, path = tempfile.mkstemp(suffix=".pem")
    os.close(fd)
    subprocess.run(
        ["openssl", "genpkey", "-algorithm", "RSA", "-pkeyopt", "rsa_keygen_bits:2048", "-out", path],
        check=True, capture_output=True,
    )
    return path


def test_mint_jwt_structure_and_signature_verifies():
    if not HAS_OPENSSL:
        return  # environment without openssl — skip the signing round-trip
    key_path = _gen_rsa_key()
    tmp = []
    try:
        with open(key_path, "rb") as f:
            key_pem = f.read()
        jwt = at.mint_jwt(42, key_pem)
        parts = jwt.split(".")
        assert len(parts) == 3
        assert json.loads(_b64url_decode(parts[0]))["alg"] == "RS256"
        payload = json.loads(_b64url_decode(parts[1]))
        assert payload["iss"] == "42" and 0 < payload["exp"] - payload["iat"] <= 600

        # The signature must verify against the public key — proves rsa_sign is correct.
        pub = subprocess.run(["openssl", "rsa", "-in", key_path, "-pubout"],
                             capture_output=True).stdout
        for blob in (pub, _b64url_decode(parts[2]), (parts[0] + "." + parts[1]).encode()):
            fd, p = tempfile.mkstemp(); os.write(fd, blob); os.close(fd); tmp.append(p)
        pubf, sigf, dataf = tmp
        v = subprocess.run(["openssl", "dgst", "-sha256", "-verify", pubf,
                            "-signature", sigf, dataf], capture_output=True)
        assert v.returncode == 0, v.stderr.decode()
    finally:
        os.unlink(key_path)
        for p in tmp:
            os.unlink(p)


def test_installation_token_flow(monkeypatch):
    calls = []
    monkeypatch.setattr(at, "mint_jwt", lambda app_id, key: "JWT")

    def fake_api(path, jwt=None, method="GET"):
        calls.append((method, path, jwt))
        if path.endswith("/installation"):
            return {"id": 999}
        if "access_tokens" in path:
            return {"token": "ghs_abc"}
        raise AssertionError("unexpected path " + path)

    monkeypatch.setattr(at, "api", fake_api)
    tok = at.installation_token(42, b"key", "owner/name")
    assert tok == "ghs_abc"
    assert calls[0] == ("GET", "/repos/owner/name/installation", "JWT")
    assert calls[1][0] == "POST" and "/app/installations/999/access_tokens" in calls[1][1]


def test_installation_token_rejects_bad_repo():
    try:
        at.installation_token(42, b"key", "no-slash")
        assert False, "should reject a repo without owner/name"
    except SystemExit as e:
        assert "owner/name" in str(e)


if __name__ == "__main__":
    import types

    class _MP:
        def __init__(self):
            self._undo = []

        def setattr(self, obj, name, val):
            self._undo.append((obj, name, getattr(obj, name)))
            setattr(obj, name, val)

        def undo(self):
            for obj, name, old in reversed(self._undo):
                setattr(obj, name, old)
            self._undo = []

    failures = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and isinstance(fn, types.FunctionType):
            mp = _MP()
            try:
                fn(mp) if fn.__code__.co_argcount else fn()
                print(f"ok   {name}")
            except Exception as e:  # noqa: BLE001
                failures += 1
                print(f"FAIL {name}: {e}")
            finally:
                mp.undo()
    sys.exit(1 if failures else 0)
