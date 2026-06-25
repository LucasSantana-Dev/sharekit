#!/usr/bin/env python3
"""app_token.py — mint a GitHub App installation access token (stdlib + openssl only).

Signs an RS256 JWT with the App's private key, discovers the App's installation for a
repo, and exchanges the JWT for a ~1h installation access token, printed to stdout. Use it
to set GH_TOKEN so `gh` / post_review.py act as the App (a `<app-slug>[bot]` identity) —
never a personal account.

No pip dependencies: `urllib` for the API, `base64`/`json`/`time` for the JWT, and `openssl`
(subprocess) for the one thing Python stdlib can't do — RSA signing. The private key is fed
to openssl via stdin and never written to disk.

Usage:
  # key PEM on stdin (e.g. piped from the macOS Keychain), app id + repo as args:
  security find-generic-password -s code-review-app-key -a "$USER" -w \\
    | python3 app_token.py --app-id 123456 --repo owner/name
  # or read the key from a file:
  python3 app_token.py --app-id 123456 --repo owner/name --key-file app.private-key.pem

Env fallbacks: --app-id ← CODE_REVIEW_APP_ID. Exit non-zero with a clear message on any
failure (missing openssl, bad key, app not installed on the repo, token exchange error).
"""
import argparse
import base64
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

API = "https://api.github.com"


def b64url(data: bytes) -> str:
    """base64url without padding (JWT wire format)."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def rsa_sign(signing_input: bytes, key_pem: bytes) -> bytes:
    """RS256 signature via openssl. Key is passed on stdin (never written to disk);
    only the non-secret signing input goes to a 0600 temp file (openssl needs the key
    on stdin and the data as a file)."""
    if not shutil.which("openssl"):
        raise SystemExit("openssl not found on PATH — required to sign the App JWT.")
    fd, datapath = tempfile.mkstemp(prefix="crjwt-")
    try:
        os.write(fd, signing_input)
        os.close(fd)
        p = subprocess.run(
            ["openssl", "dgst", "-sha256", "-sign", "/dev/stdin", datapath],
            input=key_pem, capture_output=True,
        )
        if p.returncode != 0:
            raise SystemExit(
                "openssl could not sign the JWT (bad/unsupported private key?): "
                + p.stderr.decode(errors="replace").strip()[:200]
            )
        return p.stdout
    finally:
        os.unlink(datapath)


def mint_jwt(app_id, key_pem: bytes) -> str:
    """A short-lived RS256 JWT for the App (iat backdated 60s for clock skew, exp 9 min
    — under GitHub's 10-min cap)."""
    now = int(time.time())
    header = {"alg": "RS256", "typ": "JWT"}
    payload = {"iat": now - 60, "exp": now + 540, "iss": str(app_id)}
    signing_input = (
        b64url(json.dumps(header, separators=(",", ":")).encode())
        + "."
        + b64url(json.dumps(payload, separators=(",", ":")).encode())
    ).encode("ascii")
    sig = rsa_sign(signing_input, key_pem)
    return signing_input.decode("ascii") + "." + b64url(sig)


def api(path, jwt=None, method="GET"):
    url = path if path.startswith("http") else API + path
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "code-review-app-token",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if jwt:
        headers["Authorization"] = f"Bearer {jwt}"
    req = urllib.request.Request(url, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        hint = ""
        if e.code == 404 and "installation" in url:
            hint = " (is the App installed on this repo?)"
        raise SystemExit(f"GitHub API {method} {url} -> {e.code}{hint}: {body[:300]}")
    except urllib.error.URLError as e:
        raise SystemExit(f"network error calling {url}: {e}")


def installation_token(app_id, key_pem: bytes, repo: str) -> str:
    owner, _, name = repo.partition("/")
    if not owner or not name:
        raise SystemExit(f"--repo must be 'owner/name', got {repo!r}")
    jwt = mint_jwt(app_id, key_pem)
    inst = api(f"/repos/{owner}/{name}/installation", jwt=jwt)
    inst_id = inst.get("id")
    if not inst_id:
        raise SystemExit(f"no installation id for {repo}")
    tok = api(f"/app/installations/{inst_id}/access_tokens", jwt=jwt, method="POST")
    token = tok.get("token")
    if not token:
        raise SystemExit("token exchange returned no token")
    return token


def main():
    p = argparse.ArgumentParser(description="Mint a GitHub App installation access token.")
    p.add_argument("--app-id", default=os.environ.get("CODE_REVIEW_APP_ID"),
                   help="GitHub App ID (or env CODE_REVIEW_APP_ID)")
    p.add_argument("--repo", required=True, help="owner/name — the repo to scope the token to")
    p.add_argument("--key-file", help="path to the App private key PEM (default: read from stdin)")
    a = p.parse_args()
    if not a.app_id:
        raise SystemExit("--app-id (or CODE_REVIEW_APP_ID) is required")
    if a.key_file:
        with open(a.key_file, "rb") as f:
            key_pem = f.read()
    else:
        key_pem = sys.stdin.buffer.read()
    if not key_pem.strip():
        raise SystemExit("empty private key (pass --key-file or pipe the PEM on stdin)")
    print(installation_token(a.app_id, key_pem, a.repo))


if __name__ == "__main__":
    main()
