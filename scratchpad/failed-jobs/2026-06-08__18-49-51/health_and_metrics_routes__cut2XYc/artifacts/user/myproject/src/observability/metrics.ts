/**
 * Simple in-memory Prometheus-compatible metrics store.
 * Resets each isolate restart (acceptable per requirements).
 */

// ── Counter: app_requests_total{path, method, status} ──────────────────────
const requestCounters = new Map<string, number>();

export function incRequestCounter(
  path: string,
  method: string,
  status: string,
): void {
  const key = `${path}\x00${method}\x00${status}`;
  requestCounters.set(key, (requestCounters.get(key) ?? 0) + 1);
}

// ── Histogram: app_request_duration_seconds ─────────────────────────────────
const HISTOGRAM_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];

// bucket upper bound → count map, keyed by label combo "path\0method"
const histBuckets = new Map<string, Map<number, number>>();
const histSums = new Map<string, number>();
const histCounts = new Map<string, number>();

export function observeDuration(
  path: string,
  method: string,
  durationSec: number,
): void {
  const key = `${path}\x00${method}`;

  // sum
  histSums.set(key, (histSums.get(key) ?? 0) + durationSec);
  // count
  histCounts.set(key, (histCounts.get(key) ?? 0) + 1);

  // buckets
  if (!histBuckets.has(key)) {
    histBuckets.set(key, new Map());
  }
  const bMap = histBuckets.get(key)!;
  for (const le of HISTOGRAM_BUCKETS) {
    if (durationSec <= le) {
      bMap.set(le, (bMap.get(le) ?? 0) + 1);
    }
  }
  // +Inf bucket always incremented
  bMap.set(Infinity, (bMap.get(Infinity) ?? 0) + 1);
}

// ── Prometheus text format helpers ──────────────────────────────────────────

/** Escape a label value per Prometheus exposition spec. */
function escapeLabelValue(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function labelStr(pairs: Record<string, string>): string {
  const parts = Object.entries(pairs).map(
    ([k, v]) => `${k}="${escapeLabelValue(v)}"`,
  );
  return `{${parts.join(",")}}`;
}

export function renderMetrics(): string {
  const lines: string[] = [];

  // ── app_requests_total ─────────────────────────────────────────────────
  lines.push("# HELP app_requests_total Total number of HTTP requests handled by the worker.");
  lines.push("# TYPE app_requests_total counter");
  for (const [key, count] of requestCounters) {
    const [path, method, status] = key.split("\x00");
    lines.push(
      `app_requests_total${labelStr({ path, method, status })} ${count}`,
    );
  }

  // ── app_request_duration_seconds ───────────────────────────────────────
  lines.push("# HELP app_request_duration_seconds HTTP request latency in seconds.");
  lines.push("# TYPE app_request_duration_seconds histogram");

  // Collect unique label keys from all three maps
  const histKeys = new Set<string>([
    ...histBuckets.keys(),
    ...histSums.keys(),
    ...histCounts.keys(),
  ]);

  for (const key of histKeys) {
    const [path, method] = key.split("\x00");
    const labels = { path, method };
    const bMap = histBuckets.get(key) ?? new Map<number, number>();

    // emit each finite bucket
    for (const le of HISTOGRAM_BUCKETS) {
      const leStr = le.toString();
      lines.push(
        `app_request_duration_seconds_bucket${labelStr({ ...labels, le: leStr })} ${bMap.get(le) ?? 0}`,
      );
    }
    // +Inf bucket
    lines.push(
      `app_request_duration_seconds_bucket${labelStr({ ...labels, le: "+Inf" })} ${bMap.get(Infinity) ?? 0}`,
    );
    lines.push(
      `app_request_duration_seconds_sum${labelStr(labels)} ${histSums.get(key) ?? 0}`,
    );
    lines.push(
      `app_request_duration_seconds_count${labelStr(labels)} ${histCounts.get(key) ?? 0}`,
    );
  }

  lines.push(""); // trailing newline
  return lines.join("\n");
}
