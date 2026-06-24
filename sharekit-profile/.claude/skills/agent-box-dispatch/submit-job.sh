#!/usr/bin/env bash
# submit-job.sh
# Submit a job to agent-box async queue
# Usage: submit-job.sh <job-name> <prompt-file-or-string> [priority]
# Example: submit-job.sh "audit-lucky" "Review dependencies for security issues" normal

set -euo pipefail

if [[ $# -lt 2 ]]; then
	echo "Usage: submit-job.sh <job-name> <prompt-file-or-string> [priority]"
	echo ""
	echo "Examples:"
	echo "  submit-job.sh \"audit-lucky\" \"Review dependencies\""
	echo "  submit-job.sh \"pr-review\" \"~/review-prompt.txt\" high"
	exit 1
fi

JOB_NAME="$1"
PROMPT_INPUT="$2"
PRIORITY="${3:-normal}"

# Validate priority
case "$PRIORITY" in
low | normal | high) ;;
*)
	echo "ERROR: priority must be low, normal, or high"
	exit 1
	;;
esac

# Get prompt content (file or string)
if [[ -f "$PROMPT_INPUT" ]]; then
	PROMPT_CONTENT=$(cat "$PROMPT_INPUT")
else
	PROMPT_CONTENT="$PROMPT_INPUT"
fi

# Generate timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EPOCH=$(date +%s)
FILENAME="${EPOCH}-${JOB_NAME}"

# Build job file
JOB_CONTENT="# Job: ${JOB_NAME}
Submitted: ${TIMESTAMP}
Priority: ${PRIORITY}

${PROMPT_CONTENT}"

# Submit to agent-box via SSH
ssh agent-box "cat > /workspace/job-queue/pending/${FILENAME}.md" <<EOF
${JOB_CONTENT}
EOF

echo "✓ Job submitted: agent-box:/workspace/job-queue/pending/${FILENAME}.md"
echo "  Job ID: ${FILENAME}"
echo "  Priority: ${PRIORITY}"
echo ""
echo "Check results with:"
echo "  ssh agent-box \"cat /workspace/job-queue/done/${FILENAME}.md\""
