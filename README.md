## Instagram Automations (Playwright + TypeScript)

Fetch your own Instagram followers, followings, and basic profile info via authenticated web API calls. Session persists between runs.

### Features

- Single login with persisted session (Playwright storage state)
- Followers and followings via Instagram web API with pagination (`has_more`/`next_max_id`)
- Basic profile info from `web_profile_info`
- Centralized pacing with jitter and occasional spikes
- Timestamped JSON outputs in `data/`

### Requirements

- Node.js 18+
- `.env` file with:
  - `IG_USERNAME=your_username`
  - `IG_PASSWORD=your_password`
  - Optional: `HEADFUL=1` to run with browser UI

### Install

```bash
npm install
```

### Login (persist session)

```bash
npm run login
# If challenge/2FA, use headful mode:
HEADFUL=1 npm run login
```

### Usage

```bash
# Followers
npm run followers <username>

# Followings
npm run followings <username>

# Profile info
npm run profile <username>

# Headful mode for any action (optional UI):
HEADFUL=1 npm run followers <username>
npm run followers <username> -- --headful
```

### Outputs

- `data/<username>/followers/<epoch>-followers.json`
- `data/<username>/followings/<epoch>-followings.json`
- `data/<username>/profile/<epoch>-profile.json`

### Notes on pacing

- Calls are paced with randomized delays between pages to appear less bot-like.
- Defaults can be adjusted via env: `IG_PAGE_SIZE`, `IG_MAX_PAGES`, `IG_BASE_DELAY_MS`, `IG_SPIKE_PROB`.

### Scripts

```json
{
  "build": "tsc -p tsconfig.json",
  "start": "node dist/cli.js",
  "dev": "ts-node src/cli.ts",
  "login": "ts-node src/cli.ts login",
  "followers": "ts-node src/cli.ts followers",
  "followings": "ts-node src/cli.ts followings",
  "profile": "ts-node src/cli.ts profile"
}
```

### Architecture (short)

- `src/core/InstagramApiClient.ts`: central API client with error handling
- `src/api/instagram.ts`: public functions (`getProfile`, `getFollowers`, `getFollowing`)
- `src/actions/*`: thin action wrappers that persist JSON
- `src/core/pacing.ts`: jitter pacing
- `src/io/storage.ts`: snapshot IO
- `src/config.ts`, `src/errors.ts`, `src/types.ts`

See `README_ARCH.md` for a little more detail.
