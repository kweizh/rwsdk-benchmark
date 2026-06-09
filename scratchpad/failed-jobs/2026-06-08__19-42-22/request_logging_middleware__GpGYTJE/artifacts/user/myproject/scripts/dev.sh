#!/bin/bash
mkdir -p /home/user/myproject/logs

npx vite dev 2>&1 | while IFS= read -r line; do
  if [[ "$line" == *"__ACCESS_LOG__"* ]]; then
    # Extract everything after __ACCESS_LOG__
    JSON_PART="${line#*__ACCESS_LOG__}"
    # Strip any trailing ANSI escape codes if present
    JSON_PART=$(echo "$JSON_PART" | sed -E 's/\x1b\[[0-9;]*m//g')
    echo "$JSON_PART" >> /home/user/myproject/logs/access.log
  else
    echo "$line"
  fi
done
