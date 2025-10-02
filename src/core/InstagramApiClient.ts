import type { Page } from "playwright";
import {
  ApiError,
  ForbiddenError,
  RateLimitError,
  UnauthorizedError,
} from "../errors";
import type { Profile, UserId, UserSummary } from "../types";

type WebProfileInfoResponse = {
  data?: {
    user?: {
      id?: string;
      pk?: string | number;
      username?: string;
      full_name?: string;
      biography?: string;
      is_verified?: boolean;
      profile_pic_url_hd?: string;
      edge_owner_to_timeline_media?: { count?: number };
      edge_followed_by?: { count?: number };
      edge_follow?: { count?: number };
    };
  };
};

type ConnectionsResponse = {
  users?: Array<{
    pk?: string | number;
    username?: string;
    full_name?: string;
    profile_pic_url?: string;
    is_verified?: boolean;
  }>;
  has_more?: boolean;
  next_max_id?: string;
};

async function getCookieValue(
  page: Page,
  name: string
): Promise<string | undefined> {
  return page.evaluate((cookieName: string) => {
    const parts = document.cookie.split("; ");
    for (const part of parts) {
      const [k, v] = part.split("=");
      if (k === cookieName) return decodeURIComponent(v || "");
    }
    return undefined;
  }, name);
}

async function ensureOrigin(page: Page): Promise<void> {
  if (!page.url().startsWith("https://www.instagram.com")) {
    await page.goto("https://www.instagram.com/", {
      waitUntil: "domcontentloaded",
    });
  }
}

async function fetchJson<T>(
  page: Page,
  url: string,
  headers: Record<string, string>
): Promise<T> {
  const data = await page.evaluate(
    async (args: { url: string; headers: Record<string, string> }) => {
      const res = await fetch(args.url, {
        method: "GET",
        credentials: "include",
        headers: args.headers,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { __error: true, status: res.status, body: text } as any;
      }
      return (await res.json()) as any;
    },
    { url, headers }
  );

  if (data && data.__error) {
    const status = data.status as number | undefined;
    if (status === 401) throw new UnauthorizedError(url);
    if (status === 403) throw new ForbiddenError(url);
    if (status === 429) throw new RateLimitError(url);
    throw new ApiError(`HTTP ${status ?? "error"}`, status, url);
  }

  return data as T;
}

export class InstagramApiClient {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async getProfile(username: string): Promise<Profile> {
    await ensureOrigin(this.page);
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(
      username
    )}`;
    const json = await fetchJson<WebProfileInfoResponse>(this.page, url, {
      accept: "application/json",
      "x-ig-app-id": "936619743392459",
    });
    const u = json?.data?.user ?? {};
    const id = String((u as any).id || (u as any).pk || "");
    const profile: Profile = {
      id: id,
      username: u.username || username,
      fetchedAt: new Date().toISOString(),
    };
    if (u.full_name) profile.fullName = u.full_name;
    if (u.biography) profile.bio = u.biography;
    if (u.profile_pic_url_hd) profile.avatarUrl = u.profile_pic_url_hd;
    if (u.is_verified) profile.isVerified = true;
    const posts = u.edge_owner_to_timeline_media?.count;
    if (typeof posts === "number") profile.postsCount = posts;
    const followers = u.edge_followed_by?.count;
    if (typeof followers === "number") profile.followersCount = followers;
    const following = u.edge_follow?.count;
    if (typeof following === "number") profile.followingCount = following;
    return profile;
  }

  async resolveUserId(username: string): Promise<UserId> {
    const p = await this.getProfile(username);
    if (p.id) return p.id;
    await ensureOrigin(this.page);
    const selfId = await getCookieValue(this.page, "ds_user_id");
    if (selfId) return selfId;
    throw new ApiError("Could not resolve user id for target username");
  }

  async getConnections(
    kind: "followers" | "following",
    userId: UserId,
    options?: {
      pageSize?: number;
      maxPages?: number;
      csrfToken?: string;
      baseDelayMs?: number;
      wait?: (ms: number) => Promise<void>;
      computeDelay?: (baseMs?: number) => number;
    }
  ): Promise<UserSummary[]> {
    await ensureOrigin(this.page);
    const csrf =
      options?.csrfToken ??
      ((await getCookieValue(this.page, "csrftoken")) || "");

    const pageSize = options?.pageSize ?? 12;
    const maxPages = options?.maxPages ?? 1000;
    const computeDelay = options?.computeDelay;
    const waitFn = options?.wait;

    let nextMaxId: string | undefined = undefined;
    const summaries: UserSummary[] = [];

    for (let pageNum = 0; pageNum < maxPages; pageNum++) {
      const endpoint: string = `https://www.instagram.com/api/v1/friendships/${encodeURIComponent(
        userId
      )}/${kind}/?count=${pageSize}${
        nextMaxId ? `&max_id=${encodeURIComponent(nextMaxId)}` : ""
      }`;

      const json: ConnectionsResponse = await fetchJson<ConnectionsResponse>(
        this.page,
        endpoint,
        {
          accept: "application/json, text/plain, */*",
          "x-ig-app-id": "936619743392459",
          "x-requested-with": "XMLHttpRequest",
          "x-csrftoken": csrf || "",
        }
      );

      const users = json?.users ?? [];
      for (const u of users) {
        const username = u.username || String(u.pk || "");
        const id = String(u.pk || username);
        const summary: UserSummary = { id, username };
        if (u.full_name) summary.fullName = u.full_name;
        if (u.profile_pic_url) summary.avatarUrl = u.profile_pic_url;
        if (typeof u.is_verified === "boolean")
          summary.isVerified = u.is_verified;
        summaries.push(summary);
      }

      const hasMore = (json as any)?.has_more === true;
      if (!hasMore) break;
      nextMaxId = (json as any)?.next_max_id;

      if (computeDelay && waitFn) {
        const ms = computeDelay(options?.baseDelayMs);
        await waitFn(ms);
      }
    }

    return summaries;
  }
}
