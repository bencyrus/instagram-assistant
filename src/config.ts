export type PaginationConfig = {
  pageSize: number;
  maxPages: number;
  baseDelayMs: number;
  spikeProbability: number;
};

function toInt(value: string | undefined, fallback: number): number {
  const n = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function toFloat(value: string | undefined, fallback: number): number {
  const n = value ? parseFloat(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export const DEFAULTS: PaginationConfig = {
  pageSize: toInt(process.env.IG_PAGE_SIZE, 12),
  maxPages: toInt(process.env.IG_MAX_PAGES, 500),
  baseDelayMs: toInt(process.env.IG_BASE_DELAY_MS, 1700),
  spikeProbability: toFloat(process.env.IG_SPIKE_PROB, 0.15),
};

export const USER_AGENT =
  process.env.IG_USER_AGENT ||
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export const VIEWPORT = { width: 1280, height: 900 } as const;
