import type { Page } from "playwright";
import type { ProfileInfo, InstagramUserSummary } from "../types";

type WebProfileInfoResponse = {
  data?: {
    user?: {
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

export async function fetchWebProfileInfo(
  page: Page,
  username: string
): Promise<ProfileInfo> {
  // Ensure we are on instagram origin to avoid CORS issues
  if (!page.url().startsWith("https://www.instagram.com")) {
    await page.goto("https://www.instagram.com/", {
      waitUntil: "domcontentloaded",
    });
  }

  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(
    username
  )}`;

  const data = await page.evaluate(async (endpoint) => {
    const res = await fetch(endpoint, {
      method: "GET",
      credentials: "include",
      headers: {
        accept: "application/json",
        // historically required on some endpoints; harmless if ignored
        "x-ig-app-id": "936619743392459",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as any;
  }, url);

  const json: WebProfileInfoResponse = data;
  const u = json?.data?.user ?? {};

  const info: ProfileInfo = {
    username: u.username || username,
    fetchedAt: new Date().toISOString(),
  };

  if (u.full_name) info.fullName = u.full_name;
  if (u.biography) info.bio = u.biography;
  if (u.profile_pic_url_hd) info.avatarUrl = u.profile_pic_url_hd;
  if (u.is_verified) info.isVerified = true;
  const posts = u.edge_owner_to_timeline_media?.count;
  if (typeof posts === "number") info.postsCount = posts;
  const followers = u.edge_followed_by?.count;
  if (typeof followers === "number") info.followersCount = followers;
  const following = u.edge_follow?.count;
  if (typeof following === "number") info.followingCount = following;

  return info;
}

type FollowingsResponse = {
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
  return page.evaluate((cookieName) => {
    const parts = document.cookie.split("; ");
    for (const part of parts) {
      const [k, v] = part.split("=");
      if (k === cookieName) return decodeURIComponent(v || "");
    }
    return undefined;
  }, name);
}

export async function fetchFollowingsApi(
  page: Page,
  username: string,
  opts?: { pageSize?: number; maxPages?: number; baseDelayMs?: number }
): Promise<InstagramUserSummary[]> {
  return fetchConnections(page, username, "following", opts);
}

export async function fetchFollowersApi(
  page: Page,
  username: string,
  opts?: { pageSize?: number; maxPages?: number; baseDelayMs?: number }
): Promise<InstagramUserSummary[]> {
  return fetchConnections(page, username, "followers", opts);
}

async function fetchConnections(
  page: Page,
  username: string,
  kind: "followers" | "following",
  opts?: { pageSize?: number; maxPages?: number; baseDelayMs?: number }
): Promise<InstagramUserSummary[]> {
  const pageSize = opts?.pageSize ?? 12;
  const maxPages = opts?.maxPages ?? 1000;
  const baseDelayMs = opts?.baseDelayMs ?? 1400;

  if (!page.url().startsWith("https://www.instagram.com")) {
    await page.goto("https://www.instagram.com/", {
      waitUntil: "domcontentloaded",
    });
  }

  // Resolve user id for the target username
  const targetProfile = await fetchWebProfileInfo(page, username);
  const userId =
    (targetProfile as any)?.id || (targetProfile as any)?.pk || undefined;
  // Fallback to cookie if not available (own account)
  const selfId = await getCookieValue(page, "ds_user_id");
  const finalUserId = userId || selfId;
  if (!finalUserId)
    throw new Error("Could not resolve user id for target username");
  const csrf = (await getCookieValue(page, "csrftoken")) || "";

  let nextMaxId: string | undefined = undefined;
  const summaries: InstagramUserSummary[] = [];

  for (let pageNum = 0; pageNum < maxPages; pageNum++) {
    const endpoint = `https://www.instagram.com/api/v1/friendships/${encodeURIComponent(
      finalUserId
    )}/${kind}/?count=${pageSize}${
      nextMaxId ? `&max_id=${encodeURIComponent(nextMaxId)}` : ""
    }`;

    const json = (await page.evaluate(
      async (args: { url: string; csrfToken: string }) => {
        const { url, csrfToken } = args;
        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            accept: "application/json, text/plain, */*",
            "x-ig-app-id": "936619743392459",
            "x-requested-with": "XMLHttpRequest",
            "x-csrftoken": csrfToken || "",
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as any;
      },
      { url: endpoint, csrfToken: csrf }
    )) as FollowingsResponse;

    const users = json?.users ?? [];
    for (const u of users) {
      const username = u.username || String(u.pk || "");
      const summary: InstagramUserSummary = {
        id: username,
        username,
      };
      if (u.full_name) summary.fullName = u.full_name;
      if (u.profile_pic_url) summary.avatarUrl = u.profile_pic_url;
      if (typeof u.is_verified === "boolean")
        summary.isVerified = u.is_verified;
      summaries.push(summary);
    }

    const hasMore = (json as any)?.has_more === true;
    if (!hasMore) break;
    nextMaxId = (json as any)?.next_max_id;

    // Randomized pacing to reduce rate limits
    let delayMs = Math.round(baseDelayMs * (0.8 + Math.random() * 0.8));
    if (Math.random() < 0.15) delayMs = Math.round(delayMs * 2); // occasional longer waits
    await page.waitForTimeout(delayMs);
  }

  return summaries;
}
