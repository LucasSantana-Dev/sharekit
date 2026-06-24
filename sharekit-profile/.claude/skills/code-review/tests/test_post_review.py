"""Unit tests for post_review.py — the deterministic plumbing under the skill.

Run: python3 -m pytest tests/ -q   (or: python3 tests/test_post_review.py)
"""
import json
import os
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import post_review as pr  # noqa: E402


@contextmanager
def _findings_file(data):
    """Write findings JSON to a temp file, yield its path, and always unlink it."""
    f = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False)
    try:
        json.dump(data, f)
        f.close()
        yield f.name
    finally:
        os.unlink(f.name)


def test_fmt_comment_body_basic():
    out = pr.fmt_comment_body({"severity": "P1", "title": "bug", "body": "why"})
    assert "bug" in out and "why" in out


def test_fmt_comment_body_suggestion_block():
    out = pr.fmt_comment_body(
        {"severity": "P2", "title": "t", "body": "b", "suggestion": "  fixed()"}
    )
    assert "```suggestion" in out and "fixed()" in out


def test_diff_lines_uses_filename_not_path(monkeypatch):
    # Regression guard: the GitHub /files API returns `filename`, not `path`.
    fake = [{"filename": "src/a.ts", "patch": "@@ -1,2 +1,3 @@\n ctx\n+a\n+b"}]
    monkeypatch.setattr(pr, "sh", lambda *a, **k: json.dumps(fake))
    valid = pr.diff_lines("o", "n", 1)
    assert valid["src/a.ts"] == {2, 3}  # the two added lines, at new-file positions


def test_diff_lines_binary_file_has_no_lines(monkeypatch):
    monkeypatch.setattr(pr, "sh", lambda *a, **k: json.dumps([{"filename": "x.png"}]))
    assert pr.diff_lines("o", "n", 1)["x.png"] == set()


def test_cmd_post_empty_findings_raises_error(monkeypatch):
    """Empty findings should raise an error instead of posting a meaningless review."""
    class Args:
        pr = "123"
        repo = None
        event = "COMMENT"
        dry_run = True
        body_file = None

    monkeypatch.setattr(pr, "resolve_repo", lambda x: ("owner", "name"))
    args = Args()
    with _findings_file([]) as fp:
        args.findings = fp
        try:
            pr.cmd_post(args)
            raise AssertionError("cmd_post should have raised SystemExit for empty findings")
        except SystemExit as e:
            assert "empty" in str(e).lower(), f"Error message should mention empty findings: {e}"


def test_validate_finding_rejects_non_int_line():
    # Test that validation catches non-int line.
    finding = {"path": "a.py", "line": "not-an-int", "severity": "P1", "title": "bug", "body": "bad"}
    try:
        pr.validate_finding(finding, 0)
        assert False, "Should have raised SystemExit"
    except SystemExit as e:
        # Error message must name the finding index and field
        assert "finding[0]" in str(e) and "line" in str(e)


def test_validate_finding_rejects_non_int_start_line():
    # Test that validation catches non-int start_line.
    finding = {"path": "a.py", "line": 1, "start_line": "bad", "severity": "P1", "title": "bug", "body": "bad"}
    try:
        pr.validate_finding(finding, 5)
        assert False, "Should have raised SystemExit"
    except SystemExit as e:
        # Error message must name the finding index and field
        assert "finding[5]" in str(e) and "start_line" in str(e)


def test_validate_finding_rejects_invalid_severity():
    # Test that validation catches invalid severity.
    finding = {"path": "a.py", "line": 1, "severity": "INVALID", "title": "bug", "body": "bad"}
    try:
        pr.validate_finding(finding, 2)
        assert False, "Should have raised SystemExit"
    except SystemExit as e:
        # Error message must name the finding index and field
        assert "finding[2]" in str(e) and "severity" in str(e)


def test_validate_finding_allows_missing_optional_fields():
    # Missing optional fields like start_line, severity (defaults to P2) should be OK
    finding = {"path": "a.py", "line": 1, "title": "bug", "body": "bad"}
    pr.validate_finding(finding, 0)  # Should not raise


def test_diff_lines_maps_renamed_file(monkeypatch):
    # F9: a renamed file — GH returns the new `filename` + `previous_filename`.
    # Findings against either path must land on the diff.
    fake = [{"filename": "src/new.ts", "previous_filename": "src/old.ts",
             "patch": "@@ -1,2 +1,3 @@\n ctx\n+a\n+b"}]
    monkeypatch.setattr(pr, "sh", lambda *a, **k: json.dumps(fake))
    valid = pr.diff_lines("o", "n", 1)
    assert valid["src/new.ts"] == {2, 3}
    assert valid["src/old.ts"] == {2, 3}  # old path maps to the same lines


def test_last_baseline_with_login_paginated_single_call(monkeypatch):
    # F10 + F11: when the login is passed, no extra `gh api user` round-trip,
    # and the reviews fetch is paginated.
    calls = []
    reviews = [{"user": {"login": "me"}, "body": "hi " + pr.MARKER + "deadbeef -->"}]

    def fake_sh(args, *a, **k):
        calls.append(args)
        return json.dumps(reviews)

    monkeypatch.setattr(pr, "sh", fake_sh)
    base = pr._last_baseline("o", "n", 1, login="me")
    assert base == "deadbeef"
    assert len(calls) == 1              # F11: no `gh api user` lookup
    assert "--paginate" in calls[0]     # F10: reviews fetch is paginated


def test_last_baseline_fetches_login_when_absent(monkeypatch):
    # F11 backward-compat: without a login, it still resolves the viewer first.
    calls = []

    def fake_sh(args, *a, **k):
        calls.append(args)
        if "user" in args:
            return "me\n"
        return json.dumps([{"user": {"login": "me"}, "body": pr.MARKER + "cafe -->"}])

    monkeypatch.setattr(pr, "sh", fake_sh)
    base = pr._last_baseline("o", "n", 1)
    assert base == "cafe"
    assert len(calls) == 2              # user lookup + reviews


def test_cmd_threads_preserves_full_body(monkeypatch):
    # F2: the first-comment body must not be truncated in the threads output.
    import io
    import contextlib

    long_body = "x" * 500
    me = "me"
    thread = {"id": "T1", "isResolved": False, "isOutdated": False,
              "comments": {"nodes": [{"path": "a.py", "line": 1, "databaseId": 9,
                                       "body": long_body, "author": {"login": me}}]}}
    monkeypatch.setattr(pr, "resolve_repo", lambda r: ("o", "n"))
    monkeypatch.setattr(pr, "_threads_query", lambda o, n, p: [thread])
    monkeypatch.setattr(pr, "_last_baseline", lambda *a, **k: "base")
    monkeypatch.setattr(pr, "sh", lambda *a, **k: me + "\n")

    class Args:
        repo = None
        pr = 1

    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        pr.cmd_threads(Args())
    out = json.loads(buf.getvalue())
    assert out["open"][0]["body"] == long_body
    assert len(out["open"][0]["body"]) == 500


def test_cmd_post_downgrades_event_on_self_authored_pr(monkeypatch):
    # F13: REQUEST_CHANGES/APPROVE on your own PR is downgraded to COMMENT.
    import io
    import contextlib

    monkeypatch.setattr(pr, "resolve_repo", lambda r: ("o", "n"))
    monkeypatch.setattr(pr, "pr_head_sha", lambda o, n, p: "sha1")
    monkeypatch.setattr(pr, "pr_author", lambda o, n, p: "me")
    monkeypatch.setattr(pr, "diff_lines", lambda o, n, p: {"a.py": {2}})
    monkeypatch.setattr(pr, "sh", lambda *a, **k: "me\n")  # `gh api user` == author

    class Args:
        pr = 1
        repo = None
        event = "REQUEST_CHANGES"
        dry_run = True
        body_file = None

    args = Args()
    findings = [{"path": "a.py", "line": 2, "severity": "P1", "title": "t", "body": "b"}]
    with _findings_file(findings) as fp:
        args.findings = fp
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            pr.cmd_post(args)
    payload = json.loads(buf.getvalue())
    assert payload["event"] == "COMMENT"  # downgraded from REQUEST_CHANGES


def test_cmd_post_comment_event_skips_author_check(monkeypatch):
    # F13: the default COMMENT event must not trigger the extra author lookup.
    import io
    import contextlib

    author_calls = []
    monkeypatch.setattr(pr, "resolve_repo", lambda r: ("o", "n"))
    monkeypatch.setattr(pr, "pr_head_sha", lambda o, n, p: "sha1")
    monkeypatch.setattr(pr, "diff_lines", lambda o, n, p: {"a.py": {2}})
    monkeypatch.setattr(pr, "pr_author", lambda *a: author_calls.append(a) or "someone")

    class Args:
        pr = 1
        repo = None
        event = "COMMENT"
        dry_run = True
        body_file = None

    args = Args()
    findings = [{"path": "a.py", "line": 2, "severity": "P1", "title": "t", "body": "b"}]
    with _findings_file(findings) as fp:
        args.findings = fp
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            pr.cmd_post(args)
    payload = json.loads(buf.getvalue())
    assert payload["event"] == "COMMENT"
    assert author_calls == []  # author check gated behind event != COMMENT


def test_sh_missing_command_raises_clear_error(monkeypatch):
    # Graceful degradation: a missing `gh`/python3 yields an actionable error,
    # not a raw FileNotFoundError traceback.
    def boom(*a, **k):
        raise FileNotFoundError()

    monkeypatch.setattr(pr.subprocess, "run", boom)
    try:
        pr.sh(["gh", "api", "user"])
        assert False, "should raise SystemExit"
    except SystemExit as e:
        msg = str(e).lower()
        assert "not found" in msg and "gh" in msg


def test_cmd_resolve_calls_graphql_per_thread(monkeypatch):
    # cmd_resolve runs one resolveReviewThread mutation per thread id.
    import io
    import contextlib

    calls = []
    monkeypatch.setattr(pr, "sh", lambda args, *a, **k: calls.append(args) or "")

    class Args:
        thread_id = ["T1", "T2"]

    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        pr.cmd_resolve(Args())
    assert len(calls) == 2
    assert all("graphql" in c for c in calls)
    assert any("id=T1" in " ".join(c) for c in calls)
    assert any("id=T2" in " ".join(c) for c in calls)
    assert "resolved T1" in buf.getvalue() and "resolved T2" in buf.getvalue()


def test_cmd_reply_posts_thread_reply(monkeypatch):
    # cmd_reply posts one addPullRequestReviewThreadReply mutation with the body.
    import io
    import contextlib

    calls = []
    monkeypatch.setattr(pr, "sh", lambda args, *a, **k: calls.append(args) or "")

    class Args:
        thread_id = "T9"
        body = "Resolved in abc123"

    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        pr.cmd_reply(Args())
    assert len(calls) == 1
    joined = " ".join(calls[0])
    assert "graphql" in joined and "t=T9" in joined and "addPullRequestReviewThreadReply" in joined
    assert "replied to T9" in buf.getvalue()


def test_assert_post_identity_blocks_mismatch(monkeypatch):
    # CODE_REVIEW_BOT_LOGIN set + gh user differs → refuse to post.
    monkeypatch.setattr(pr, "sh", lambda *a, **k: "some-human\n")
    os.environ["CODE_REVIEW_BOT_LOGIN"] = "review-bot"
    try:
        pr.assert_post_identity()
        assert False, "should raise SystemExit"
    except SystemExit as e:
        assert "refusing to post" in str(e).lower() and "review-bot" in str(e)
    finally:
        os.environ.pop("CODE_REVIEW_BOT_LOGIN", None)


def test_assert_post_identity_noop_when_unset(monkeypatch):
    # Unset env → no-op, and no `gh api user` call is made.
    calls = []
    monkeypatch.setattr(pr, "sh", lambda *a, **k: calls.append(a) or "x")
    os.environ.pop("CODE_REVIEW_BOT_LOGIN", None)
    pr.assert_post_identity()
    assert calls == []


def test_cmd_baseline_prints_resolved_baseline(monkeypatch):
    # cmd_baseline prints the SHA from _last_baseline.
    import io
    import contextlib

    monkeypatch.setattr(pr, "resolve_repo", lambda r: ("o", "n"))
    monkeypatch.setattr(pr, "_last_baseline", lambda o, n, p: "abc123")

    class Args:
        repo = None
        pr = 7

    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        pr.cmd_baseline(Args())
    assert buf.getvalue().strip() == "abc123"


if __name__ == "__main__":
    # Tiny runner so the file works without pytest installed.
    import types

    class _MP:
        """Minimal monkeypatch shim WITH teardown — mirrors pytest's per-test
        revert so patched module functions don't leak between tests."""

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
