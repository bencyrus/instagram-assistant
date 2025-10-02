export async function delay(ms: number): Promise<void> {
  await new Promise((res) => setTimeout(res, ms));
}

export function nowIso(): string {
  return new Date().toISOString();
}

// Storage helpers moved to io/storage
