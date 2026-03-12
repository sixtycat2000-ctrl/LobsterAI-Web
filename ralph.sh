alph Loop - Autonomous Claude Code Agent
# Usage: ./ralph.sh [max_iterations]

MAX_ITERATIONS=${1:-50}
ITERATION=0

echo "=== Ralph Autonomous Loop ==="
echo "Max iterations: $MAX_ITERATIONS"
echo ""

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    echo "--- Iteration $ITERATION of $MAX_ITERATIONS ---"

    # Check if DONE file exists (completion signal)
    if [ -f "DONE" ]; then
        echo "✅ DONE file found. Task complete!"
        break
    fi

    # Run Claude Code in non-interactive (headless) mode
    claude -p \
        "you are the test expert with agent-browser (automation & console logs if you need) + backend server log monitoring (backend log visible). read docs/TEST-PROGRESS.md and docs/UI-INTEGRATION-TEST-PLAN.md please complete the test throughly and update progress. anytime you have bug detected, try focus and fix it.remember react latest best practices. we have unlimited time and resource." \
        --dangerously-skip-permissions

    # Small delay to avoid rate limits
    sleep 2

    echo ""
done

echo "Loop ended after $ITERATION iterations."
