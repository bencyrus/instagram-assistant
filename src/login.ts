import { Page, BrowserContext } from "playwright";
import { Credentials } from "./types";
import { saveStorageState } from "./session";

async function wait(ms: number): Promise<void> {
  await new Promise((res) => setTimeout(res, ms));
}

export async function ensureLoggedIn(
  page: Page,
  context: BrowserContext,
  creds: Credentials
): Promise<void> {
  await page.goto("https://www.instagram.com/", { waitUntil: "load" });

  // Helper: robust logged-in detection
  const isLoggedInNow = async () => {
    const selAny = await Promise.all([
      page.locator('a[href*="/accounts/edit/"]').first().count(),
      page.locator('nav a[href="/"]').first().count(),
      page.locator('svg[aria-label="New post"]').first().count(),
    ]);
    return selAny.some((c) => c > 0);
  };

  async function waitUntilLoggedIn(maxMs: number): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      if (await isLoggedInNow()) return true;
      await wait(1500);
    }
    return false;
  }

  if (await isLoggedInNow()) {
    await saveStorageState(context);
    return;
  }

  // Go to login page and attempt login
  await page.goto("https://www.instagram.com/accounts/login/", {
    waitUntil: "domcontentloaded",
  });

  const usernameField = page.locator(
    'input[name="username"], input[name="email"]'
  );
  const passwordField = page.locator('input[name="password"]');
  await usernameField.waitFor({ state: "visible", timeout: 30000 });
  await usernameField.fill(creds.username, { timeout: 15000 });
  await wait(500 + Math.random() * 500);
  await passwordField.fill(creds.password, { timeout: 15000 });
  await wait(500 + Math.random() * 500);

  const loginBtn = page
    .locator('button[type="submit"], div[role="button"]:has-text("Log in")')
    .first();
  await loginBtn.click();

  // Wait for either navigation, logged-in, or challenge/2FA
  const challengeSelector =
    'input[autocomplete="one-time-code"], input[name="security_code"], input[name="verificationCode"]';
  const possibleResults = Promise.race([
    page
      .waitForNavigation({ waitUntil: "load", timeout: 60000 })
      .catch(() => null),
    page
      .waitForSelector(challengeSelector, { timeout: 60000 })
      .catch(() => null),
  ]);
  await possibleResults;

  // Handle Save login info / Notifications dialogs if they appear
  const saveInfo = page.locator('div[role="dialog"] button:has-text("Save")');
  if (await saveInfo.count()) {
    await saveInfo.click();
    await wait(500);
  }
  const notNow = page.locator('div[role="dialog"] button:has-text("Not Now")');
  if (await notNow.count()) {
    await notNow.click();
    await wait(500);
  }

  // If challenge or 2FA is presented, require HEADFUL and wait until logged in
  const challengeDetected =
    page.url().includes("/challenge/") ||
    (await page.locator(challengeSelector).count()) > 0;
  if (challengeDetected) {
    if (!process.env.HEADFUL) {
      throw new Error(
        "Instagram verification required. Re-run with HEADFUL=1 npm run login and complete the challenge in the browser."
      );
    }
    console.log(
      "Instagram presented a verification challenge. Complete it in the browser window; waiting up to 10 minutes..."
    );
    const ok = await waitUntilLoggedIn(10 * 60 * 1000);
    if (!ok) {
      throw new Error(
        "Verification not completed in time. Try again with HEADFUL=1 and complete the challenge."
      );
    }
  }

  // Final login verification
  if (!(await isLoggedInNow())) {
    if (process.env.HEADFUL) {
      // In headful mode, give extra time even if we didn't detect explicit challenge
      const ok = await waitUntilLoggedIn(10 * 60 * 1000);
      if (ok) {
        await saveStorageState(context);
        return;
      }
    }
    throw new Error(
      "Login failed. Check credentials or complete verification with HEADFUL=1."
    );
  }

  await saveStorageState(context);
}
