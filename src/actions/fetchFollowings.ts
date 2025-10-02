import { withPage } from "../session";
import { ensureLoggedIn } from "../login";
import { getCredentials } from "../env";
import { InstagramUserSummary, ScrapeResult } from "../types";
import { fetchFollowingsApi } from "../api/instagram";
import { nowIso } from "../utils";
import { saveJson } from "../utils";

export async function fetchFollowings(
  headless = true,
  username: string
): Promise<ScrapeResult<InstagramUserSummary>> {
  const creds = getCredentials();
  const target = username.trim();
  return withPage(headless, async (page, context) => {
    await ensureLoggedIn(page, context, creds);
    const items = await fetchFollowingsApi(page, target, {
      pageSize: 12,
      baseDelayMs: 1700,
      maxPages: 500,
    });
    const result: ScrapeResult<InstagramUserSummary> = {
      items,
      total: items.length,
      fetchedAt: nowIso(),
    };
    await saveJson(target, "followings", result);
    return result;
  });
}
