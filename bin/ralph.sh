# ralph.sh
# Usage: ./ralph.sh <iterations>

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

PROMPT="@PRD.json @PROGRESS.txt
1. Decide which task to work on next. This should be the one YOU decide has the highest priority, not necessarily the first in the list.
2. Check any feedback loops, such as rubocop and the test suite.
3. After completing a task, mark that task in the PRD as passing=true
4. After completing a task, also update the progress.txt with the following:
- The task completed and its PRD id for reference
- Key decisions made and reasoning
- Any blockers or notes for next iteration
- Keep entries concise. Sacrifice grammar for the sake of concision. This file helps future iterations skip exploration.
- Two newlines between tasks (easier scannability)
5. Run test suite and linters. If any issues arise, fix them until the pass.
6. Make a git commit of that feature with the message prefixed with 'AGENT: '.
7. ONLY WORK ON A SINGLE FEATURE.
8. If, while implementing the feature, you notice that all work is complete, output <promise>COMPLETE</promise>.

The progress updates should follow this template:

---

[PRD-ID-001]

Description

**Key decisions:**
- Decision 1
- Decision 2

**Files changed:**
- file/2
- file/1"

for ((i=1; i<=$1; i++)); do
  echo "=== Iteration $i of $1 ==="
  
  # Use tee to both stream output to user and capture it for completion check
  result=$(cursor-agent -p "$PROMPT" --force --sandbox enabled --stream-partial-output --output-format stream-json | jq --unbuffered -rjf bin/format-chat.jq | tee /dev/tty)

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete, exiting."
    exit 0
  fi
done

