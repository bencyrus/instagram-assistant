import fs from "fs";
import path from "path";
import { withPage } from "../session";
import { ensureLoggedIn } from "../login";
import { getCredentials, DATA_DIR } from "../env";
import { ProfileInfo } from "../types";
import { fetchWebProfileInfo } from "../api/instagram";

export async function fetchOwnProfile(headless = true): Promise<ProfileInfo> {
  const creds = getCredentials();
  return withPage(headless, async (page, context) => {
    await ensureLoggedIn(page, context, creds);
    const info = await fetchWebProfileInfo(page, creds.username);
    const outDir = path.join(DATA_DIR, "profile");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const epoch = Date.now();
    const outPath = path.join(outDir, `${epoch}-profile.json`);
    fs.writeFileSync(outPath, JSON.stringify(info, null, 2), {
      encoding: "utf-8",
    });
    console.log(`Saved profile JSON to: ${outPath}`);
    return info;
  });
}
