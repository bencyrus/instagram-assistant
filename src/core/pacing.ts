import { DEFAULTS } from "../config";

export async function wait(ms: number): Promise<void> {
  await new Promise((res) => setTimeout(res, ms));
}

export function computeDelay(baseMs = DEFAULTS.baseDelayMs): number {
  let delayMs = Math.round(baseMs * (0.8 + Math.random() * 0.8));
  if (Math.random() < DEFAULTS.spikeProbability) {
    delayMs = Math.round(delayMs * 2);
  }
  return delayMs;
}
