import fs from "fs";
import path from "path";
import { withPage } from "../session";
import { ensureLoggedIn } from "../login";
import { getCredentials, DATA_DIR } from "../env";
import { InstagramUserSummary, ScrapeResult } from "../types";
import {
  openProfileFollowers,
  scrapeAllVisibleUsers,
} from "../scrapers/profile";

export async function fetchFollowers(
  headless = true
): Promise<ScrapeResult<InstagramUserSummary>> {
  const creds = getCredentials();
  return withPage(headless, async (page, context) => {
    await ensureLoggedIn(page, context, creds);
    await openProfileFollowers(page, creds.username);
    const items = await scrapeAllVisibleUsers(page);
    const result: ScrapeResult<InstagramUserSummary> = {
      items,
      total: items.length,
      fetchedAt: new Date().toISOString(),
    };
    const outDir = path.join(DATA_DIR, "followers");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const epoch = Date.now();
    const outPath = path.join(outDir, `${epoch}-followers.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), {
      encoding: "utf-8",
    });
    return result;
  });
}
