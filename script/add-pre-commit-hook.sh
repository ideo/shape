#!/usr/bin/env bash

GIT_DIR=$(git rev-parse --git-dir)
HOOK="$GIT_DIR/hooks/pre-commit"

if [ -f "$HOOK" ]; then
  if ! grep -q 'script/pre-commit' "$HOOK"; then
    echo "Found an existing pre-commit hook, adding script/pre-commit to it"
    echo "Please double-check $HOOK to ensure that it will run"
    echo script/pre-commit >> "$HOOK"
  fi
else
  echo "Installing pre-commit hook to $HOOK"
  mkdir -p "$GIT_DIR"/hooks
  echo script/pre-commit >> "$HOOK"
  chmod +x "$HOOK"
fi
