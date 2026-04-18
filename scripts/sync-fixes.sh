#!/usr/bin/env bash
#
# Fast-forwards the `fixes` branch to match `main` so Railway staging
# catches up to anything committed directly to `main`.
#
# Golden rule: `fixes` is never behind `main`.
#
# Run: bun run sync
#
# Exits:
#   0 — fixes already in sync, or successfully fast-forwarded
#   1 — dirty working tree, or fixes has diverged from main
#
set -euo pipefail

echo "Fetching origin..."
git fetch origin --prune --quiet

main_sha=$(git rev-parse origin/main)
fixes_sha=$(git rev-parse origin/fixes)

if [ "$main_sha" = "$fixes_sha" ]; then
  echo "OK: fixes is already in sync with main ($(git rev-parse --short "$main_sha"))."
  exit 0
fi

# Is fixes strictly behind main? (main has commits fixes doesn't, and fixes has none main doesn't)
if git merge-base --is-ancestor "$fixes_sha" "$main_sha"; then
  ahead=$(git rev-list --count "$fixes_sha..$main_sha")
  echo "fixes is $ahead commit(s) behind main. Fast-forwarding..."

  if [ -n "$(git status --porcelain)" ]; then
    echo "FAIL: working tree has uncommitted changes. Commit or stash first."
    exit 1
  fi

  starting_branch=$(git rev-parse --abbrev-ref HEAD)

  if [ "$starting_branch" = "fixes" ]; then
    git merge --ff-only origin/main
    git push origin fixes
  else
    # Use a detached fetch-push to avoid a checkout dance.
    git fetch . "origin/main:fixes" 2>&1 | tail -1
    git push origin fixes
  fi

  echo "OK: fixes is now at $(git rev-parse --short origin/main)."
  exit 0
fi

# fixes has commits main doesn't — not safe to auto-resolve.
fixes_ahead=$(git rev-list --count "$main_sha..$fixes_sha")
main_ahead=$(git rev-list --count "$fixes_sha..$main_sha")
echo "FAIL: branches have diverged."
echo "      fixes is $fixes_ahead commit(s) ahead of main."
echo "      main  is $main_ahead commit(s) ahead of fixes."
echo
echo "Resolve manually. Common cases:"
echo "  1. You finished the fixes work — merge fixes into main:"
echo "       git checkout main && git merge --ff-only origin/fixes && git push origin main"
echo "     (if ff-only fails, main has moved — pick case 2 or 3.)"
echo
echo "  2. Direct main commits happened during fixes work — rebase fixes onto main:"
echo "       git checkout fixes && git rebase origin/main && git push --force-with-lease origin fixes"
echo
echo "  3. Discard fixes and start over from main (loses fixes commits):"
echo "       git checkout fixes && git reset --hard origin/main && git push --force-with-lease origin fixes"
exit 1
