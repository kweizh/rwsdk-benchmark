// Module load time for uptime calculation
const startTime = Date.now();

// Counter storage: key is "path|method|status", value is count
const counters = new Map<string, number>();

// Histogram bucket boundaries (must match the spec)
const BUCKET_BOUNDARIES = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];

interface HistogramEntry {
  buckets: number[];
  sum: number;
  count: number;
}

// Histogram storage: key is "path|method|status"
const histograms = new Map<string, HistogramEntry>();

function counterKey(path: string, method: string, status: string): string {
  return `${path}|${method}|${status}`;
}

function histogramKey(path: string, method: string, status: string): string {
  return `${path}|${method}|${status}`;
}

function parseKey(key: string): { path: string; method: string; status: string } {
  const parts = key.split("|");
  return { path: parts[0], method: parts[1], status: parts[2] };
}

/** Increment the request counter for the given labels. */
export function incrementCounter(
  path: string,
  method: string,
  status: string
): void {
  const key = counterKey(path, method, status);
  const current = counters.get(key) ?? 0;
  counters.set(key, current + 1);
}

/** Observe a request duration for the given labels. */
export function observeDuration(
  path: string,
  method: string,
  status: string,
  duration: number
): void {
  const key = histogramKey(path, method, status);
  let entry = histograms.get(key);
  if (!entry) {
    entry = {
      buckets: new Array(BUCKET_BOUNDARIES.length).fill(0) as number[],
      sum: 0,
      count: 0,
    };
    histograms.set(key, entry);
  }

  // Increment all buckets where duration <= boundary (cumulative)
  for (let i = 0; i < BUCKET_BOUNDARIES.length; i++) {
    if (duration <= BUCKET_BOUNDARIES[i]) {
      entry.buckets[i]++;
    }
  }

  entry.sum += duration;
  entry.count++;
}

/** Get uptime in seconds since module load. */
export function getUptimeSeconds(): number {
  return (Date.now() - startTime) / 1000;
}

/** Escape a label value per the Prometheus exposition format. */
function escapeLabelValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

/** Format Prometheus labels from a record. */
function formatLabels(labels: Record<string, string>): string {
  const parts = Object.entries(labels).map(
    ([key, value]) => `${key}="${escapeLabelValue(value)}"`
  );
  return parts.length > 0 ? `{${parts.join(",")}}` : "";
}

/** Export all collected metrics in Prometheus text exposition format. */
export function formatMetrics(): string {
  const lines: string[] = [];

  // Counter: app_requests_total
  lines.push("# HELP app_requests_total Total number of HTTP requests");
  lines.push("# TYPE app_requests_total counter");

  for (const [key, value] of counters.entries()) {
    const { path, method, status } = parseKey(key);
    lines.push(
      `app_requests_total${formatLabels({ path, method, status })} ${value}`
    );
  }

  // Histogram: app_request_duration_seconds
  lines.push("");
  lines.push(
    "# HELP app_request_duration_seconds Request duration in seconds"
  );
  lines.push("# TYPE app_request_duration_seconds histogram");

  for (const [key, entry] of histograms.entries()) {
    const { path, method, status } = parseKey(key);
    const labels = { path, method, status };

    // Bucket lines (cumulative)
    for (let i = 0; i < BUCKET_BOUNDARIES.length; i++) {
      const bucketLabels = {
        ...labels,
        le: BUCKET_BOUNDARIES[i].toString(),
      };
      lines.push(
        `app_request_duration_seconds_bucket${formatLabels(bucketLabels)} ${entry.buckets[i]}`
      );
    }
    // +Inf bucket (equal to count)
    lines.push(
      `app_request_duration_seconds_bucket${formatLabels({ ...labels, le: "+Inf" })} ${entry.count}`
    );
    // Sum
    lines.push(
      `app_request_duration_seconds_sum${formatLabels(labels)} ${entry.sum}`
    );
    // Count
    lines.push(
      `app_request_duration_seconds_count${formatLabels(labels)} ${entry.count}`
    );
  }

  return lines.join("\n");
}