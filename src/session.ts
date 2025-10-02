import { chromium } from "playwright";
import type {
  Browser,
  BrowserContext,
  Page,
  BrowserContextOptions,
} from "playwright";
import path from "path";
import fs from "fs";
import { STORAGE_DIR } from "./env";

const STORAGE_STATE_PATH = path.join(STORAGE_DIR, "storage-state.json");

export async function getContext(
  headless = true
): Promise<{ browser: Browser; context: BrowserContext }> {
  const browser = await chromium.launch({ headless });
  const hasStorage = fs.existsSync(STORAGE_STATE_PATH);
  const options: BrowserContextOptions = {
    viewport: { width: 1280, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  if (hasStorage) {
    options.storageState = STORAGE_STATE_PATH;
  }
  const context = await browser.newContext(options);
  return { browser, context };
}

export async function saveStorageState(context: BrowserContext): Promise<void> {
  await context.storageState({ path: STORAGE_STATE_PATH });
}

export async function withPage<T>(
  headless: boolean,
  fn: (page: Page, context: BrowserContext) => Promise<T>
): Promise<T> {
  const { browser, context } = await getContext(headless);
  const page = await context.newPage();
  try {
    const result = await fn(page, context);
    return result;
  } finally {
    await context.close();
    await browser.close();
  }
}

export function isLoggedInStoragePresent(): boolean {
  return fs.existsSync(STORAGE_STATE_PATH);
}
