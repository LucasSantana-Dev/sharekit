#!/usr/bin/env python3
"""post_review.py — post a Senior-QA review to a GitHub PR as a single batched
review with inline threads, and drive the fix → re-review loop.

CodeRabbit/cubic-style: ONE review event (summary + per-finding inline threads),
each thread independently resolvable; re-review runs incrementally against a
baseline SHA stamped in the prior review body, resolving threads whose finding
is gone and re-flagging the ones still open.

All GitHub access goes through the `gh` CLI (must be authenticated). The model
supplies findings as JSON and makes the judgment calls; this script only does the
deterministic, error-prone API plumbing.

Subcommands
-----------
  post <pr> <findings.json> [--repo o/r] [--event COMMENT|REQUEST_CHANGES|APPROVE]
       [--dry-run]
        Post a batched review. findings.json is a list of objects:
          {"path","line"[,"start_line"][,"side"=RIGHT],"severity"(P0..P3),
           "title","body"[,"suggestion"]}
        Lines outside the PR diff are auto-moved to the summary body (GitHub
        rejects inline comments off-diff) instead of failing the whole review.

  threads <pr> [--repo o/r]
        Print this skill's review threads as JSON (id, isResolved, isOutdated,
        path, line, author, first-comment body) + the last baseline SHA. Feed
        this back to the model to decide which findings are addressed.

  resolve <thread_id> [<thread_id> ...]
        Resolve one or more review threads (GraphQL resolveReviewThread).

  reply <pr> <thread_id> <body> [--repo o/r]
        Reply to a review thread (GraphQL addPullRequestReviewThreadReply).

  baseline <pr> [--repo o/r]
        Print the baseline SHA stamped in our most recent review (empty if none).
"""
import argparse
import json
import subprocess
import sys

MARKER = "<!-- code-review:baseline="  # body marker: <!-- code-review:baseline=<sha> -->
SEV_ORDER = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
SEV_LABEL = {
    "P0": "P0 — Blocker",
    "P1": "P1 — Incorrect",
    "P2": "P2 — Quality",
    "P3": "P3 — Polish",
}


def sh(args, input_=None, check=True):
    """Run a command, return stdout. Raises with stderr on failure when check."""
    p = subprocess.run(
        args, input=input_, capture_output=True, text=True
    )
    if check and p.returncode != 0:
        sys.stderr.write(p.stderr)
        raise SystemExit(f"command failed ({p.returncode}): {' '.join(args)}")
    return p.stdout


def resolve_repo(repo):
    if repo:
        owner, name = repo.split("/", 1)
        return owner, name
    out = sh(["gh", "repo", "view", "--json", "owner,name"])
    d = json.loads(out)
    return d["owner"]["login"], d["name"]


def pr_head_sha(owner, name, pr):
    out = sh(["gh", "api", f"repos/{owner}/{name}/pulls/{pr}",
              "--jq", ".head.sha"])
    return out.strip()


def diff_lines(owner, name, pr):
    """Return {path: set(of RIGHT-side line numbers present in the diff)}.

    Used to keep inline comments on lines GitHub will accept; everything else is
    folded into the summary so a single bad line never sinks the whole review.
    """
    files = json.loads(sh(["gh", "api", "--paginate",
                           f"repos/{owner}/{name}/pulls/{pr}/files"]))
    valid = {}
    for f in files:
        path = f["path"]
        patch = f.get("patch")
        if not patch:
            valid[path] = set()  # binary/large file: treat all as off-diff
            continue
        lines = set()
        new_ln = 0
        for ln in patch.splitlines():
            if ln.startswith("@@"):
                # @@ -a,b +c,d @@
                try:
                    plus = ln.split("+", 1)[1].split(" ", 1)[0]
                    new_ln = int(plus.split(",")[0]) - 1
                except (IndexError, ValueError):
                    new_ln = 0
            elif ln.startswith("+"):
                new_ln += 1
                lines.add(new_ln)
            elif ln.startswith("-"):
                pass
            else:
                new_ln += 1
        valid[path] = lines
    return valid


def fmt_comment_body(f):
    body = f"**{SEV_LABEL.get(f.get('severity','P2'), f.get('severity','P2'))}** — {f.get('title','').strip()}\n\n{f.get('body','').strip()}"
    sug = f.get("suggestion")
    if sug:
        body += "\n\n```suggestion\n" + sug.rstrip("\n") + "\n```"
    return body


def cmd_post(a):
    owner, name = resolve_repo(a.repo)
    findings = json.loads(open(a.findings).read())
    if not isinstance(findings, list):
        raise SystemExit("findings.json must be a JSON list")
    head = pr_head_sha(owner, name, a.pr)
    valid = diff_lines(owner, name, a.pr)

    inline, offdiff = [], []
    for f in findings:
        path, line = f.get("path"), f.get("line")
        if path and line and line in valid.get(path, set()):
            c = {"path": path, "line": int(line),
                 "side": f.get("side", "RIGHT"), "body": fmt_comment_body(f)}
            if f.get("start_line"):
                c["start_line"] = int(f["start_line"])
                c["start_side"] = f.get("side", "RIGHT")
            inline.append(c)
        else:
            offdiff.append(f)

    counts = {}
    for f in findings:
        counts[f.get("severity", "P2")] = counts.get(f.get("severity", "P2"), 0) + 1
    summary = (
        "## Senior-QA review\n\n"
        + " · ".join(f"{k}: {counts[k]}" for k in sorted(counts, key=lambda s: SEV_ORDER.get(s, 9)))
        + f"\n\n{len(inline)} inline · {len(offdiff)} summary-only finding(s).\n"
    )
    if offdiff:
        summary += "\n### Findings not on the diff\n"
        for f in sorted(offdiff, key=lambda x: SEV_ORDER.get(x.get("severity", "P2"), 9)):
            loc = f"`{f.get('path','?')}:{f.get('line','?')}` — " if f.get("path") else ""
            summary += f"- **{f.get('severity','P2')}** {loc}{f.get('title','').strip()}\n"
    summary += f"\n{MARKER}{head} -->"

    payload = {"event": a.event, "body": summary, "comments": inline}
    if a.dry_run:
        print(json.dumps(payload, indent=2))
        return
    out = sh(["gh", "api", f"repos/{owner}/{name}/pulls/{a.pr}/reviews",
              "--method", "POST", "--input", "-"],
             input_=json.dumps(payload))
    rid = json.loads(out).get("id")
    print(f"posted review {rid}: {len(inline)} inline thread(s), event={a.event}, baseline={head}")


def _threads_query(owner, name, pr):
    q = """query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){
      pullRequest(number:$n){reviewThreads(first:100){nodes{
        id isResolved isOutdated
        comments(first:1){nodes{path line databaseId body author{login}}}}}}}}"""
    out = sh(["gh", "api", "graphql", "-f", f"query={q}",
              "-F", f"o={owner}", "-F", f"r={name}", "-F", f"n={pr}"])
    nodes = json.loads(out)["data"]["repository"]["pullRequest"]["reviewThreads"]["nodes"]
    return nodes


def _last_baseline(owner, name, pr):
    me = sh(["gh", "api", "user", "--jq", ".login"]).strip()
    reviews = json.loads(sh(["gh", "api", f"repos/{owner}/{name}/pulls/{pr}/reviews"]))
    base = ""
    for r in reviews:  # reviews are chronological; keep the last marker
        login = (r.get("user") or {}).get("login", "")
        body = r.get("body") or ""
        if MARKER in body and (login == me or login.endswith("[bot]")):
            base = body.split(MARKER, 1)[1].split(" ", 1)[0]
    return base


def cmd_threads(a):
    owner, name = resolve_repo(a.repo)
    me = sh(["gh", "api", "user", "--jq", ".login"]).strip()
    out = []
    for t in _threads_query(owner, name, a.pr):
        c = (t["comments"]["nodes"] or [{}])[0]
        if (c.get("author") or {}).get("login") != me:
            continue  # only our own threads
        out.append({
            "id": t["id"], "isResolved": t["isResolved"], "isOutdated": t["isOutdated"],
            "path": c.get("path"), "line": c.get("line"),
            "body": (c.get("body") or "")[:200],
        })
    print(json.dumps({
        "baseline": _last_baseline(owner, name, a.pr),
        "open": [t for t in out if not t["isResolved"]],
        "resolved": [t for t in out if t["isResolved"]],
    }, indent=2))


def cmd_resolve(a):
    q = "mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}"
    for tid in a.thread_id:
        sh(["gh", "api", "graphql", "-f", f"query={q}", "-F", f"id={tid}"])
        print(f"resolved {tid}")


def cmd_reply(a):
    q = ("mutation($t:ID!,$b:String!){addPullRequestReviewThreadReply("
         "input:{pullRequestReviewThreadId:$t,body:$b}){comment{id}}}")
    sh(["gh", "api", "graphql", "-f", f"query={q}", "-F", f"t={a.thread_id}", "-F", f"b={a.body}"])
    print(f"replied to {a.thread_id}")


def cmd_baseline(a):
    owner, name = resolve_repo(a.repo)
    print(_last_baseline(owner, name, a.pr))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("post"); sp.add_argument("pr"); sp.add_argument("findings")
    sp.add_argument("--repo"); sp.add_argument("--event", default="COMMENT",
                    choices=["COMMENT", "REQUEST_CHANGES", "APPROVE"])
    sp.add_argument("--dry-run", action="store_true"); sp.set_defaults(fn=cmd_post)

    sp = sub.add_parser("threads"); sp.add_argument("pr"); sp.add_argument("--repo")
    sp.set_defaults(fn=cmd_threads)

    sp = sub.add_parser("resolve"); sp.add_argument("thread_id", nargs="+")
    sp.set_defaults(fn=cmd_resolve)

    sp = sub.add_parser("reply"); sp.add_argument("pr"); sp.add_argument("thread_id")
    sp.add_argument("body"); sp.add_argument("--repo"); sp.set_defaults(fn=cmd_reply)

    sp = sub.add_parser("baseline"); sp.add_argument("pr"); sp.add_argument("--repo")
    sp.set_defaults(fn=cmd_baseline)

    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
