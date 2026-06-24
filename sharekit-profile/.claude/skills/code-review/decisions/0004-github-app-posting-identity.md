# ADR-0004: Post reviews under a GitHub App identity (not a personal account or machine-account PAT)

- **Status:** Accepted
- **Date:** 2026-06-05
- **Deciders:** Lucas Santana (solo operator)
- **Supersedes:** (none — extends ADR-0003's posting mechanism)
- **Superseded by:** (none)

## Context

A live review was posted under the operator's personal account (`<github-user>`), which is a
hard no. ADR-0003 added `assert_post_identity` (refuse to post unless the authenticated `gh`
login matches `CODE_REVIEW_BOT_LOGIN`), and a first fix wired a **machine account + fine-grained
PAT** in the macOS Keychain. The operator then asked whether a **GitHub App** is the better
identity. It is — and it's how the peer tools this skill emulates (CodeRabbit, Greptile, cubic)
actually authenticate.

Phase-1 research (3 read-only agents, web-verified) confirmed the App path is viable under the
skill's constraints: the RS256 JWT can be signed with **`openssl` alone** (no PyJWT/cryptography),
the resulting installation token works as `GH_TOKEN` with **zero change** to the gh-shelling
`post_review.py`, and an App can submit reviews + resolve/reply threads as `<app-slug>[bot]` with
`Pull requests: write` + `Contents: read`. An App reviewing a *human-authored* PR has no
self-approval restriction.

**Distinction from ADR-0003:** ADR-0003 rejected a GitHub App *as an always-on reviewer*
(server-side, webhook-driven, redundant with cubic). This ADR adopts an App *only as the posting
identity* for the existing **on-demand** flow — no server, no webhook, no auto-trigger. Orthogonal
concern; ADR-0003's rejection does not apply.

## Decision

**Post reviews under a dedicated GitHub App identity.** Mechanism (bundled, dependency-free):

1. Register a GitHub App (`Pull requests: write`, `Contents: read`, `Metadata: read`), install it
   on the target repos. Store its RSA private key (`.pem`) in the macOS login Keychain (per
   `shell-secret-management.md`).
2. A bundled minter `scripts/app_token.py` (**Python stdlib + `openssl` only**): builds the JWT
   header/claims and does base64url in Python (robust — avoids bash base64url footguns), shells
   `openssl dgst -sha256 -sign` for the RSA signature only, auto-discovers the installation via
   `GET /repos/{o}/{r}/installation`, exchanges the JWT for an installation token, prints it.
3. The local wrapper sets `GH_TOKEN=<installation-token>` + `CODE_REVIEW_BOT_LOGIN=<app-slug>[bot]`
   and runs `post_review.py` — which acts as the App with no code change. `assert_post_identity`
   still guards. Token minted **once per invocation** (covers a review + its threads), not per call.

The machine-account + fine-grained PAT path remains a **documented fallback** (works directly with
`gh`); the App is the recommended identity.

## Alternatives considered

- **Machine account + fine-grained PAT** (the critic's preferred option) — works with `gh` today,
  no JWT minting, lower failure surface. Rejected as the *primary* path because it is a *fake human
  account* (own email, 2FA, recovery, consumes a seat), uses a long-lived manually-rotated token,
  and is not the honest representation of an automated reviewer. Kept as the documented fallback.
- **Classic PAT** — broad scopes, long-lived. Rejected: worse blast radius than fine-grained.
- **Pure-Python-stdlib JWT minter (no openssl)** — infeasible: Python stdlib has no RSA (`hmac`/
  `hashlib` are symmetric); RS256 requires `openssl` or a pip crypto lib. openssl chosen to stay
  dep-free.
- **Status quo (personal account)** — rejected: the hard requirement this whole thread exists for.
- **GitHub App as always-on reviewer** — out of scope; rejected in ADR-0003 and not what this is.

## Consequences

**Positive:**
- True `[bot]` identity — never the personal profile; no fake human account/seat; matches peer tools.
- Per-repo installation permissions; auto-expiring (~1h) installation tokens (no manual PAT rotation).
- Stays dependency-free (stdlib + `openssl` + `gh`); `post_review.py` unchanged.

**Negative (dissent from the Phase-2 critic, recorded honestly):**
- **More moving parts than a PAT** for a solo operator: registration, installation, a JWT-mint shim,
  installation-ID discovery, 1h token churn. The critic rated this gold-plating absent demonstrated
  demand; the operator's explicit preference + the never-personal-profile requirement + the
  honest-identity/no-fake-account benefit are the demand.
- **Blast radius:** one `.pem` signs tokens for every installation — higher-value to leak than a
  per-repo PAT. Mitigated: Keychain storage, fine-grained App perms, few installs, rotation reminder.
- **Fragility risk** in hand-rolled JWT: mitigated by doing encoding/JSON/discovery/errors in Python
  and shelling `openssl` only for the signature; clear errors for missing key / app-not-installed /
  openssl-absent / token-exchange failure.

**Neutral:**
- `post_review.py` is unchanged; the App is wired entirely in the local wrapper + `app_token.py`.

## Revisit when

- The JWT/openssl minter proves fragile across machines/openssl versions → reconsider a small pinned
  dep or `gh`'s app-auth extension.
- The operator finds the App setup/maintenance not worth it in practice → fall back to the documented
  machine-account + PAT path (still wired).
- Cross-agent/headless/CI posting is needed → an installation token works there too, but revisit
  minting location (CI secret vs Keychain).
- A second contributor or org-scale use appears → the App already scales; revisit per-repo installs.

## References

- ADR-0003 (bundled-script packaging; rejected App-as-always-on-reviewer) — this extends, not contradicts.
- `shell-secret-management.md` (Keychain for CLI secrets).
- Phase-1 research (web-verified auth mechanics) + Phase-2 critic (REJECT dissent), session 2026-06-05.
- GitHub docs: authenticating as a GitHub App / generating an installation access token.
