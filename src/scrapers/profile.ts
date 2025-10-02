import { Page } from "playwright";
import { InstagramUserSummary } from "../types";
import { jitteredDelay } from "../utils";

async function scrollModalToLoad(
  page: Page,
  containerSelector: string,
  itemSelector: string,
  maxScrolls = 400
): Promise<void> {
  let lastCount = 0;
  for (let i = 0; i < maxScrolls; i++) {
    const currentCount = await page.$$eval(
      `${containerSelector} ${itemSelector}`,
      (els) => els.length
    );
    if (currentCount > lastCount) {
      lastCount = currentCount;
    } else {
      break;
    }
    await page.evaluate((selector: string) => {
      const container = document.querySelector(selector) as HTMLElement | null;
      if (!container) return;
      let scrollable: HTMLElement = container;
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_ELEMENT
      );
      while (walker.nextNode()) {
        const el = walker.currentNode as HTMLElement;
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight
        ) {
          scrollable = el;
          break;
        }
      }
      scrollable.scrollTop += scrollable.clientHeight;
    }, containerSelector);
    await jitteredDelay(900, 0.4);
  }
}

export async function openProfileFollowers(
  page: Page,
  username: string
): Promise<void> {
  // Navigate to profile then click Followers to trigger modal reliably
  await page.goto(
    `https://www.instagram.com/${encodeURIComponent(username)}/`,
    {
      waitUntil: "domcontentloaded",
    }
  );
  const followersLink = page.locator('a[href$="/followers/"]');
  await followersLink.first().waitFor({ state: "visible", timeout: 60000 });
  await followersLink.first().click();
  await page.waitForSelector('div[role="dialog"]', { timeout: 60000 });
}

export async function openProfileFollowing(
  page: Page,
  username: string
): Promise<void> {
  // Navigate to profile then click Following to trigger modal reliably
  await page.goto(
    `https://www.instagram.com/${encodeURIComponent(username)}/`,
    {
      waitUntil: "domcontentloaded",
    }
  );
  const followingLink = page.locator('a[href$="/following/"]');
  await followingLink.first().waitFor({ state: "visible", timeout: 60000 });
  await followingLink.first().click();
  await page.waitForSelector('div[role="dialog"]', { timeout: 60000 });
}

function parseUserElements(page: Page, containerSelector: string) {
  return page.$eval(containerSelector, (container) => {
    const anchors = Array.from(
      container.querySelectorAll('a[href^="/"][href$="/"]')
    );
    const unique = new Map<string, any>();
    for (const a of anchors) {
      const href = (a as HTMLAnchorElement).getAttribute("href") || "";
      if (!href.startsWith("/")) continue;
      const username = href.split("/").filter(Boolean)[0];
      if (
        !username ||
        username.includes("explore") ||
        username.includes("accounts") ||
        username.includes("reels") ||
        username.includes("stories") ||
        username.includes("direct")
      )
        continue;
      const containerEl =
        (a.closest("._ab8w") as HTMLElement | null) ||
        (a.closest("li") as HTMLElement | null) ||
        (a.parentElement as HTMLElement | null);
      const img =
        (containerEl?.querySelector("img") as HTMLImageElement) || null;
      const nameEl = containerEl?.querySelector(
        "._aacl._aaco._aacu._aacx._aad7._aade"
      ) as HTMLElement | null;
      const fullName = nameEl?.textContent || undefined;
      const avatarUrl = img?.src || undefined;
      unique.set(username, {
        id: username,
        username,
        fullName,
        avatarUrl,
      });
    }
    return Array.from(unique.values());
  });
}

export async function scrapeAllVisibleUsers(
  page: Page,
  containerSelector: string = 'div[role="dialog"]'
): Promise<InstagramUserSummary[]> {
  await page.waitForSelector(containerSelector, { timeout: 60000 });
  // Best-effort wait for the first anchor inside the modal
  await page
    .waitForSelector(`${containerSelector} a[href^="/"][href$="/"]`, {
      timeout: 15000,
    })
    .catch(() => undefined);
  await scrollModalToLoad(page, containerSelector, 'a[href^="/"][href$="/"]');
  const users = await parseUserElements(page, containerSelector);
  return users as InstagramUserSummary[];
}
