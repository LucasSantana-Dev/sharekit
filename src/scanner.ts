import kleur from 'kleur';

export interface Finding {
  rule: string;
  file?: string;
  line: number;
  preview: string;
  severity: 'high' | 'medium' | 'low';
}

// Construct a preview string from a line, given match index and window params.
// Adds leading/trailing ellipsis when substring is clipped.
export function truncatePreview(
  line: string,
  idx: number,
  contextBefore = 5,
  maxLen = 40,
  addLeadingEllipsis = true
): string {
  const start = Math.max(0, idx - contextBefore);
  const end = Math.min(line.length, idx + maxLen);
  const leading = addLeadingEllipsis && start > 0 ? '…' : '';
  const trailing = end < line.length ? '…' : '';
  return leading + line.substring(start, end) + trailing;
}

// Shared helper: print findings and apply gate logic (high-severity blocks unless force=true)
export function printAndGateFindings(findings: Finding[], force = false): void {
  if (findings.length === 0) {
    console.log(kleur.green('  ✓ No secrets detected.\n'));
    return;
  }

  // Print warnings if secrets found
  console.log(kleur.yellow(`\n  ⚠  Secret patterns detected:`));
  for (const finding of findings) {
    console.log(
      kleur.yellow(`    ${finding.file}:${finding.line} [${finding.rule}] ${finding.preview}`)
    );
  }
  console.log(
    kleur.yellow(`\n  ⚠  Review and redact secrets before pushing to a public repository.\n`)
  );

  // Gate: block export if high-severity findings and no --force
  const highSeverityFindings = findings.filter((f) => f.severity === 'high');
  if (highSeverityFindings.length > 0 && !force) {
    throw new Error(
      `Secrets export blocked: ${highSeverityFindings.length} high-severity finding(s) detected. ` +
        `Review and remove secrets, or re-run with --force to override.`
    );
  }
}

export function scanForSecrets(content: string, fileLabel?: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Rule 1: Private key blocks (HIGH)
    if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(line)) {
      const preview = line.substring(0, 40) + (line.length > 40 ? '…' : '');
      findings.push({
        rule: 'Private Key Block',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 2: AWS access key (HIGH)
    const awsMatch = /AKIA[0-9A-Z]{16}/.exec(line);
    if (awsMatch) {
      const preview = truncatePreview(line, awsMatch.index, 5, 20);
      findings.push({
        rule: 'AWS Access Key ID',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 3: GitHub PAT ghp_ format (HIGH) — at least 20 chars after ghp_
    const githubGhpMatch = /ghp_[A-Za-z0-9_]{20,}/.exec(line);
    if (githubGhpMatch) {
      const preview = truncatePreview(line, githubGhpMatch.index, 5, 40);
      findings.push({
        rule: 'GitHub Personal Access Token',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 4: GitHub PAT github_pat_ format (HIGH) — at least 20 chars after prefix
    const githubPatMatch = /github_pat_[A-Za-z0-9_]{20,}/.exec(line);
    if (githubPatMatch) {
      const preview = truncatePreview(line, githubPatMatch.index, 5, 40);
      findings.push({
        rule: 'GitHub Personal Access Token',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 5: Slack tokens (HIGH)
    const slackMatch = /xox[baprs]-[A-Za-z0-9-]{10,}/.exec(line);
    if (slackMatch) {
      const preview = truncatePreview(line, slackMatch.index, 5, 40);
      findings.push({
        rule: 'Slack Token',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 6: Google API keys AIza format (HIGH)
    const googleMatch = /AIza[0-9A-Za-z\-_]{35}/.exec(line);
    if (googleMatch) {
      const preview = truncatePreview(line, googleMatch.index, 5, 40);
      findings.push({
        rule: 'Google API Key',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 7: Bearer JWT (HIGH) — eyJ prefix identifies base64-encoded JSON header (JWT)
    const bearerMatch = /Bearer eyJ[A-Za-z0-9._\-]{17,}/.exec(line);
    if (bearerMatch) {
      const preview = truncatePreview(line, bearerMatch.index, 0, 30, false);
      findings.push({
        rule: 'Bearer Token',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'high',
      });
      continue;
    }

    // Rule 8: Home directory path leak (LOW)
    const homeDirMatch = /(\/Users\/[a-zA-Z0-9_-]+|\/home\/[a-zA-Z0-9_-]+)/.exec(line);
    if (homeDirMatch) {
      const preview = truncatePreview(line, homeDirMatch.index, 5, 40);
      findings.push({
        rule: 'Home Directory Path Leak',
        file: fileLabel,
        line: lineNum,
        preview,
        severity: 'low',
      });
      continue;
    }

    // Rule 9: Generic KEY=value with sensitive key names, including export prefix (MEDIUM)
    // Match both "KEY=value" and "export KEY=value"
    const envMatch = /(?:^|\s)(?:export\s+)?([A-Z_]+?)=(.*)$/.exec(line);
    if (envMatch) {
      const keyName = envMatch[1].toUpperCase();
      const value = envMatch[2];

      // Check if key name contains sensitive keywords
      if (/(SECRET|TOKEN|PASSWORD|API_KEY|APIKEY|ACCESS_KEY)/i.test(keyName)) {
        // Ignore if value is empty or a placeholder
        const placeholders = ['""', "''", 'xxx', '<', 'changeme', 'your-', 'your_'];
        const isPlaceholder =
          value === '' ||
          value === '""' ||
          value === "''" ||
          placeholders.some((p) => value.startsWith(p));

        if (!isPlaceholder) {
          const preview = value.substring(0, 8) + (value.length > 8 ? '…' : '');
          findings.push({
            rule: 'Env Var: Sensitive Key',
            file: fileLabel,
            line: lineNum,
            preview: `${keyName}=${preview}`,
            severity: 'medium',
          });
          continue;
        }
      }
    }
  }

  return findings;
}
