# Instagram Automation (Playwright + TypeScript)

This project automates fetching your own Instagram followers and followings using Playwright with persistent sessions.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```bash
IG_USERNAME=your_username
IG_PASSWORD=your_password
# HEADFUL=1  # Uncomment to see the browser
```

## First Login

```bash
npm run login
```

On first run, you'll be prompted to login. The session is persisted in `playwright/.auth/storage-state.json` and reused until invalid.

## Actions

- Fetch followers:

```bash
npm run followers
```

Writes `data/followers-<username>.json`.

- Fetch followings:

```bash
npm run followings
```

Writes `data/followings-<username>.json`.

## Notes

- Set `HEADFUL=1` to run non-headless if you need to pass any verification.
- Basic delays/jitter are used to avoid rate-limiting. Consider longer waits for large lists.
- This scrapes UI content only for your own profile lists; no API calls.
