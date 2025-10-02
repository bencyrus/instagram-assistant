import { withPage } from "../session";
import { ensureLoggedIn } from "../login";
import { getCredentials } from "../env";
import { Profile } from "../types";
import { getProfile } from "../api/instagram";
import { nowIso } from "../utils";
import { saveJson } from "../io/storage";

export async function fetchOwnProfile(
  headless = true,
  username: string
): Promise<Profile> {
  const creds = getCredentials();
  const target = username.trim();
  return withPage(headless, async (page, context) => {
    await ensureLoggedIn(page, context, creds);
    const info = await getProfile(page, target);
    const withTimestamp: Profile = { ...info, fetchedAt: nowIso() };
    await saveJson(target, "profile", withTimestamp);
    return withTimestamp;
  });
}
