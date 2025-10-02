## Instagram Automations (Playwright + TypeScript)

Fetch your own Instagram followers, followings, and basic profile info using authenticated web API calls. Session persists between runs.

### Features

- Single login with persisted session (Playwright storage state)
- Followers and followings via Instagram web API with pagination (`has_more`/`next_max_id`)
- Basic profile info from `web_profile_info`
- Randomized, slower delays to reduce rate-limit risk
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
npm run followers

# Followings
npm run followings

# Profile info
npm run profile

# Headful mode for any action (optional UI):
HEADFUL=1 npm run followers
```

### Outputs

- `data/followers/<epoch>-followers.json`
- `data/followings/<epoch>-followings.json`
- `data/profile/<epoch>-profile.json`

### Notes on Speed and Rate Limits

- Calls are paced with randomized delays between pages to appear less bot-like.
- You can adjust pacing by changing the `baseDelayMs`, `pageSize`, or `maxPages` in `src/actions/fetchFollowers.ts` and `src/actions/fetchFollowings.ts`.

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

### Architecture

- `src/api/instagram.ts`: Web API helpers (profile info, followers, followings)
- `src/actions/*`: Action entrypoints that call API helpers and write JSON
- `src/login.ts`: Robust login and storage-state persistence
- `src/session.ts`: Browser/context helpers
- `src/types.ts`: Shared types
- `src/cli.ts`: CLI dispatcher

UI scrapers removed; all data is collected via authenticated API calls.
