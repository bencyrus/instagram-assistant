import { withPage } from "../session";
import { ensureLoggedIn } from "../login";
import { getCredentials } from "../env";
import { ProfileInfo } from "../types";
import { fetchWebProfileInfo } from "../api/instagram";
import { nowIso } from "../utils";
import { saveJson } from "../utils";

export async function fetchOwnProfile(
  headless = true,
  username: string
): Promise<ProfileInfo> {
  const creds = getCredentials();
  const target = username.trim();
  return withPage(headless, async (page, context) => {
    await ensureLoggedIn(page, context, creds);
    const info = await fetchWebProfileInfo(page, target);
    const withTimestamp: ProfileInfo = { ...info, fetchedAt: nowIso() };
    await saveJson(target, "profile", withTimestamp);
    return withTimestamp;
  });
}
