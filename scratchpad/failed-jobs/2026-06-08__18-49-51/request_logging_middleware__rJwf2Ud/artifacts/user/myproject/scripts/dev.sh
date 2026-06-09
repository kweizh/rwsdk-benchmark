#!/usr/bin/env bash
# Wrapper around `vite dev` that tees structured access-log lines emitted by
# the requestLogger middleware into /home/user/myproject/logs/access.log.
#
# The middleware emits lines like:
#   __ACCESS_LOG__{"ts":"...","method":"GET",...}
#
# This script strips the tag and appends the bare JSON object (+ newline) to
# the log file, while passing all other output through to the terminal unchanged.

set -euo pipefail

LOG_DIR="/home/user/myproject/logs"
LOG_FILE="${LOG_DIR}/access.log"
TAG="__ACCESS_LOG__"

# Ensure the log directory exists before starting the server
mkdir -p "${LOG_DIR}"

# Run vite dev, processing stdout line by line.
# We use `stdbuf -oL` to force line-buffered output from vite so we receive
# log lines promptly.  The while-read loop writes matching lines to the log
# file and passes everything else through to the original stdout.
stdbuf -oL vite dev 2>&1 | while IFS= read -r line; do
  if [[ "${line}" == "${TAG}"* ]]; then
    # Strip the tag prefix and write the bare JSON line to the log file
    printf '%s\n' "${line#"${TAG}"}" >> "${LOG_FILE}"
  else
    printf '%s\n' "${line}"
  fi
done
