import { withPage } from "../session";
import { ensureLoggedIn } from "../login";
import { getCredentials } from "../env";
import { UserSummary, ScrapeResult } from "../types";
import { getFollowers, resolveUserId } from "../api/instagram";
import { nowIso } from "../utils";
import { saveJson } from "../io/storage";

export async function fetchFollowers(
  headless = true,
  username: string
): Promise<ScrapeResult<UserSummary>> {
  const creds = getCredentials();
  const target = username.trim();
  return withPage(headless, async (page, context) => {
    await ensureLoggedIn(page, context, creds);
    const userId = await resolveUserId(page, target);
    const items = await getFollowers(page, userId, {
      pageSize: 12,
      baseDelayMs: 1700,
      maxPages: 500,
    });
    const result: ScrapeResult<UserSummary> = {
      items,
      total: items.length,
      fetchedAt: nowIso(),
    };
    await saveJson(target, "followers", result);
    return result;
  });
}
