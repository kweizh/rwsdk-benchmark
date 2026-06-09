#!/bin/bash
# Create logs directory if it doesn't exist
mkdir -p /home/user/myproject/logs

# Run vite dev and parse its output line by line
# We use a pattern match to find "[ACCESS_LOG]" and write the rest of the line to the log file.
# We also print everything to stdout so the dev server logs are visible.
npx vite dev 2>&1 | while IFS= read -r line; do
  echo "$line"
  if [[ "$line" == *"[ACCESS_LOG]"* ]]; then
    # Extract everything after "[ACCESS_LOG] "
    json_part="${line#*\[ACCESS_LOG\] }"
    echo "$json_part" >> /home/user/myproject/logs/access.log
  fi
done
