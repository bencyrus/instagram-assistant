import { loadEnv, ensureDirs } from "./env";
import { withPage } from "./session";
import { ensureLoggedIn } from "./login";
import { getCredentials } from "./env";
import { fetchFollowers } from "./actions/fetchFollowers";
import { fetchFollowings } from "./actions/fetchFollowings";
import { fetchOwnProfile } from "./actions/fetchProfile";
import { fetchPostLikers } from "./actions/fetchPostLikers";

async function main() {
  loadEnv();
  ensureDirs();
  const [, , action = "help", ...rest] = process.argv;
  const flags = rest.filter((a) => a.startsWith("--"));
  const args = rest.filter((a) => !a.startsWith("--"));
  const maybeUsername = (args[0] || "").trim();
  const headfulFlag = flags.includes("--headful");
  const headless = !(process.env.HEADFUL || headfulFlag);

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
      if (!maybeUsername) {
        console.error(
          "Error: username is required. Usage: npm run followers <username>"
        );
        process.exit(1);
      }
      const result = await fetchFollowers(headless, maybeUsername);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "followings": {
      if (!maybeUsername) {
        console.error(
          "Error: username is required. Usage: npm run followings <username>"
        );
        process.exit(1);
      }
      const result = await fetchFollowings(headless, maybeUsername);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "profile": {
      if (!maybeUsername) {
        console.error(
          "Error: username is required. Usage: npm run profile <username>"
        );
        process.exit(1);
      }
      const result = await fetchOwnProfile(headless, maybeUsername);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "post-likers": {
      const input = (args[0] || "").trim();
      if (!input) {
        console.error(
          "Error: mediaId|shortcode|url is required. Usage: npm run post-likers <mediaId|shortcode|url>"
        );
        process.exit(1);
      }
      const result = await fetchPostLikers(headless, input);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    default: {
      console.log("Usage:");
      console.log(
        "  npm run login                      # Login and persist session"
      );
      console.log(
        "  npm run followers <user> [--headful]  # Fetch followers for <user>"
      );
      console.log(
        "  npm run followings <user> [--headful] # Fetch followings for <user>"
      );
      console.log(
        "  npm run profile <user> [--headful]    # Fetch profile for <user>"
      );
      console.log(
        "  npm run post-likers <mediaId|shortcode|url> [--headful] # Fetch post likers"
      );
      console.log("Env: IG_USERNAME, IG_PASSWORD, HEADFUL=1 to show browser");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
