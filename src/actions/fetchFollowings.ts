import fs from "fs";
import path from "path";
import { withPage } from "../session";
import { ensureLoggedIn } from "../login";
import { getCredentials, DATA_DIR } from "../env";
import { InstagramUserSummary, ScrapeResult } from "../types";
import { fetchOwnFollowingsApi } from "../api/instagram";

export async function fetchFollowings(
  headless = true
): Promise<ScrapeResult<InstagramUserSummary>> {
  const creds = getCredentials();
  return withPage(headless, async (page, context) => {
    await ensureLoggedIn(page, context, creds);
    const items = await fetchOwnFollowingsApi(page, {
      pageSize: 12,
      baseDelayMs: 1700,
      maxPages: 500,
    });
    const result: ScrapeResult<InstagramUserSummary> = {
      items,
      total: items.length,
      fetchedAt: new Date().toISOString(),
    };
    const outDir = path.join(DATA_DIR, "followings");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const epoch = Date.now();
    const outPath = path.join(outDir, `${epoch}-followings.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), {
      encoding: "utf-8",
    });
    return result;
  });
}
