#!/usr/bin/env python3
"""plugin-audit: scan ~/.claude/plugins state + Claude Code session JSONLs
to surface installed plugins, their enabled state, and actual usage.

Read-only. Outputs markdown to stdout.

Usage:
    audit.py [days=30]
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from collections import Counter
from pathlib import Path

HOME = Path.home()
PLUGINS_FILE = HOME / ".claude" / "plugins" / "installed_plugins.json"
SETTINGS_FILE = HOME / ".claude" / "settings.json"
PROJECTS_DIR = HOME / ".claude" / "projects"


def load_installed() -> dict[str, dict]:
    """Return {plugin_key: {scope, version, installedAt, lastUpdated}}."""
    if not PLUGINS_FILE.exists():
        return {}
    raw = json.load(PLUGINS_FILE.open())
    plugins = raw.get("plugins", {}) if isinstance(raw, dict) else {}
    out: dict[str, dict] = {}
    for key, installs in plugins.items():
        if not isinstance(installs, list) or not installs:
            continue
        # Take the most recent install entry
        i = installs[0]
        out[key] = {
            "scope": i.get("scope", "?"),
            "version": i.get("version", "?"),
            "installedAt": i.get("installedAt", ""),
            "lastUpdated": i.get("lastUpdated", ""),
            "installPath": i.get("installPath", ""),
        }
    return out


def load_enabled() -> dict[str, bool]:
    if not SETTINGS_FILE.exists():
        return {}
    raw = json.load(SETTINGS_FILE.open())
    return raw.get("enabledPlugins", {}) or {}


def plugin_skill_names(install_path: str) -> set[str]:
    """Walk a plugin's install dir, harvest skill names from its skills/*/SKILL.md."""
    if not install_path:
        return set()
    p = Path(install_path)
    if not p.is_dir():
        return set()
    names: set[str] = set()
    for skill_md in p.rglob("SKILL.md"):
        try:
            text = skill_md.read_text(errors="replace")[:1000]
            m = re.search(r"^name:\s*(\S+)", text, re.MULTILINE)
            if m:
                names.add(m.group(1).strip())
        except OSError:
            continue
    return names


def scan_skill_invocations(days: int) -> Counter:
    """Count plugin-namespaced skill invocations in session JSONLs.

    Plugin skills appear in the catalog as `plugin:skill`. When invoked via
    the Skill tool, the input is `{"skill": "plugin:skill", ...}`. We also
    pick up tool_use blocks named `Skill` with that input.
    """
    cutoff = time.time() - (days * 86400)
    counts: Counter = Counter()
    if not PROJECTS_DIR.is_dir():
        return counts
    for f in PROJECTS_DIR.rglob("*.jsonl"):
        try:
            if f.stat().st_mtime < cutoff:
                continue
        except OSError:
            continue
        try:
            for line in f.read_text(errors="replace").splitlines():
                if not line or '"skill"' not in line:
                    continue
                # Cheap pre-filter, then parse
                try:
                    msg = json.loads(line)
                except json.JSONDecodeError:
                    continue
                content = msg.get("message", {}).get("content")
                if not isinstance(content, list):
                    continue
                for block in content:
                    if not isinstance(block, dict):
                        continue
                    if block.get("type") != "tool_use":
                        continue
                    if block.get("name") != "Skill":
                        continue
                    inp = block.get("input", {})
                    skill = inp.get("skill") if isinstance(inp, dict) else None
                    if isinstance(skill, str):
                        counts[skill] += 1
        except OSError:
            continue
    return counts


def days_ago(iso: str) -> int | None:
    if not iso:
        return None
    try:
        # 2026-02-22T02:47:02.835Z
        from datetime import datetime, timezone
        ts = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return int((datetime.now(timezone.utc) - ts).total_seconds() // 86400)
    except (ValueError, TypeError):
        return None


def main() -> int:
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    installed = load_installed()
    enabled = load_enabled()
    invocations = scan_skill_invocations(days)

    # Map each invoked skill back to the plugin that ships it.
    plugin_to_skills: dict[str, set[str]] = {}
    skill_to_plugin: dict[str, str] = {}
    for key, meta in installed.items():
        names = plugin_skill_names(meta["installPath"])
        plugin_to_skills[key] = names
        for n in names:
            # Plugin skills are usually invoked as `plugin-shortname:skill`
            short = key.split("@", 1)[0]
            skill_to_plugin[f"{short}:{n}"] = key
            skill_to_plugin[n] = key

    # Build per-plugin usage counts
    plugin_usage: Counter = Counter()
    for skill, n in invocations.items():
        owner = skill_to_plugin.get(skill)
        if owner:
            plugin_usage[owner] += n

    # ---- Output ----
    print(f"# Plugin usage audit — last {days} days\n")
    print(f"_Generated {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}_\n")

    print(f"**Installed**: {len(installed)} · **Enabled-flag set**: "
          f"{sum(1 for v in enabled.values() if v)}/{len(enabled)} · "
          f"**Plugins with usage**: {len(plugin_usage)}\n")

    print("## By usage (last {} days)\n".format(days))
    print("| Calls | Plugin | Enabled | Installed (days ago) |")
    print("|---:|---|:-:|---:|")
    for key, _ in installed.items():
        calls = plugin_usage.get(key, 0)
        en = enabled.get(key)
        en_s = "✓" if en else ("✗" if en is False else "—")
        age = days_ago(installed[key]["installedAt"])
        age_s = f"{age}d" if age is not None else "?"
        if calls > 0:
            print(f"| {calls} | `{key}` | {en_s} | {age_s} |")

    print("\n## Zero-use enabled plugins (remove candidates)\n")
    zeros = [k for k, m in installed.items()
             if plugin_usage.get(k, 0) == 0 and enabled.get(k) is True]
    if not zeros:
        print("_(none — every enabled plugin saw at least 1 call)_")
    else:
        for k in zeros:
            age = days_ago(installed[k]["installedAt"])
            tag = f" (installed {age}d ago)" if age else ""
            print(f"- `{k}`{tag}")

    print("\n## Installed but never registered in `enabledPlugins`\n")
    print("_These were installed but neither explicitly enabled nor disabled. "
          "Decide intentionally — set true/false in settings.json or remove._\n")
    unregistered = [k for k in installed if k not in enabled]
    if not unregistered:
        print("_(none)_")
    else:
        for k in unregistered:
            calls = plugin_usage.get(k, 0)
            print(f"- `{k}` — {calls} call(s) in window")

    print("\n## Disabled but still installed (cleanup candidates)\n")
    disabled_installed = [k for k in installed
                          if enabled.get(k) is False]
    if not disabled_installed:
        print("_(none)_")
    else:
        print("_Run `claude plugins remove <key>` to free disk + reduce "
              "marketplace pull surface._\n")
        for k in disabled_installed:
            age = days_ago(installed[k]["installedAt"])
            tag = f" (installed {age}d ago)" if age else ""
            print(f"- `{k}`{tag}")

    print("\n---")
    print("_Counts plugin-namespaced Skill invocations only. Plugins that ship "
          "only commands, hooks, or MCP servers won't show usage here — pair "
          "with `mcp-audit` for MCP-side and grep `~/.claude/projects/*/*.jsonl` "
          "for slash-command invocations if needed._")
    return 0


if __name__ == "__main__":
    sys.exit(main())
