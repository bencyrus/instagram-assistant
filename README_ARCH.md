## Architecture Overview

This project is an API-first Instagram data fetcher that logs in with Playwright, persists session, and performs only authenticated web API calls.

### Layers

- `src/core/InstagramApiClient.ts`: Single place for origin assurance, cookie/CSRF handling, and typed JSON requests with error mapping.
- `src/api/instagram.ts`: Public API functions: `getProfile`, `resolveUserId`, `getConnections`, `getFollowers`, `getFollowing`.
- `src/actions/*`: Thin, user-focused actions that call the public API and persist JSON snapshots.
- `src/core/pacing.ts`: Central jitter pacing logic.
- `src/io/storage.ts`: Centralized snapshot persistence, path scheme preserved.
- `src/config.ts`: Defaults and env overrides.
- `src/errors.ts`: Typed errors for clarity and control flow.
- `src/types.ts`: Unified domain model: `UserSummary`, `Profile`, typed ids/handles.

### Extensibility

- `src/utils/diff.ts` computes added/removed connections between snapshots.
