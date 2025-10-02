export async function delay(ms: number): Promise<void> {
  await new Promise((res) => setTimeout(res, ms));
}

export async function jitteredDelay(
  baseMs: number,
  jitterFraction = 0.3
): Promise<void> {
  const jitter = baseMs * jitterFraction * (Math.random() * 2 - 1);
  await delay(Math.max(0, Math.round(baseMs + jitter)));
}
