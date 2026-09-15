const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const PER_MINUTE = 5;

/**
 * Reads a request limit from an environment variable.
 * Only a positive integer is a limit; an unset, empty, or unparseable value
 * falls back to the default. Without this, a variable that exists but is empty
 * parses as 0 and silently blocks every request.
 */
export function parseLimit(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return raw && Number.isInteger(n) && n > 0 ? n : fallback;
}

const PER_HOUR = parseLimit(process.env.RATE_LIMIT_PER_HOUR, 15);

export type RateVerdict = { allowed: true } | { allowed: false; reason: string };

/** Request timestamps per IP. In-memory: resets on cold start, not shared across instances. */
const hits = new Map<string, number[]>();

/** Records a request for `ip` and reports whether it is within both windows. */
export function checkRateLimit(ip: string, now: number = Date.now()): RateVerdict {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < HOUR);

  if (recent.filter((t) => now - t < MINUTE).length >= PER_MINUTE) {
    hits.set(ip, recent);
    return { allowed: false, reason: `too many questions — limit ${PER_MINUTE} per minute` };
  }

  if (recent.length >= PER_HOUR) {
    hits.set(ip, recent);
    return { allowed: false, reason: `too many questions — limit ${PER_HOUR} per hour` };
  }

  recent.push(now);
  hits.set(ip, recent);
  return { allowed: true };
}

/** Test helper. Clears all tracked IPs. */
export function resetRateLimits(): void {
  hits.clear();
}
