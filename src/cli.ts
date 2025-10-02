import { loadEnv, ensureDirs } from "./env";
import { withPage } from "./session";
import { ensureLoggedIn } from "./login";
import { getCredentials } from "./env";
import { fetchFollowers } from "./actions/fetchFollowers";
import { fetchFollowings } from "./actions/fetchFollowings";
import { fetchOwnProfile } from "./actions/fetchProfile";

async function main() {
  loadEnv();
  ensureDirs();
  const [, , action = "help", ...rest] = process.argv;
  const headless = !process.env.HEADFUL;

  switch (action) {
    case "login": {
      const creds = getCredentials();
      const result = await withPage(headless, async (page, context) => {
        await ensureLoggedIn(page, context, creds);
        return { ok: true };
      });
      console.log("Login successful. Session persisted.");
      return result;
    }
    case "followers": {
      const result = await fetchFollowers(headless);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "followings": {
      const result = await fetchFollowings(headless);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "profile": {
      const result = await fetchOwnProfile(headless);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    default: {
      console.log("Usage:");
      console.log("  npm run login              # Login and persist session");
      console.log(
        "  npm run followers          # Fetch followers and save JSON"
      );
      console.log(
        "  npm run followings         # Fetch followings and save JSON"
      );
      console.log(
        "  npm run profile           # Fetch own profile info and save JSON"
      );
      console.log("Env: IG_USERNAME, IG_PASSWORD, HEADFUL=1 to show browser");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
