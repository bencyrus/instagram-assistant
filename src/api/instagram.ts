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

async function getCookieValue(page: Page, name: string): Promise<string | undefined> {
  return page.evaluate((cookieName) => {
    const parts = document.cookie.split("; ");
    for (const part of parts) {
      const [k, v] = part.split("=");
      if (k === cookieName) return decodeURIComponent(v || "");
    }
    return undefined;
  }, name);
}

export async function fetchOwnFollowingsApi(
  page: Page,
  opts?: { pageSize?: number; maxPages?: number; baseDelayMs?: number }
): Promise<InstagramUserSummary[]> {
  const pageSize = opts?.pageSize ?? 12;
  const maxPages = opts?.maxPages ?? 1000;
  const baseDelayMs = opts?.baseDelayMs ?? 1400;

  if (!page.url().startsWith("https://www.instagram.com")) {
    await page.goto("https://www.instagram.com/", { waitUntil: "domcontentloaded" });
  }

  const userId = await getCookieValue(page, "ds_user_id");
  if (!userId) throw new Error("Could not determine ds_user_id from cookies");
  const csrf = (await getCookieValue(page, "csrftoken")) || "";

  let nextMaxId: string | undefined = undefined;
  const summaries: InstagramUserSummary[] = [];

  for (let pageNum = 0; pageNum < maxPages; pageNum++) {
    const endpoint = `https://www.instagram.com/api/v1/friendships/${encodeURIComponent(
      userId
    )}/following/?count=${pageSize}${nextMaxId ? `&max_id=${encodeURIComponent(nextMaxId)}` : ""}`;

    const json = (await page.evaluate(
      async (url, csrfToken) => {
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
      endpoint,
      csrf
    )) as FollowingsResponse;

    const users = json?.users ?? [];
    for (const u of users) {
      const username = u.username || String(u.pk || "");
      summaries.push({
        id: username,
        username,
        fullName: u.full_name || undefined,
        avatarUrl: u.profile_pic_url || undefined,
        isVerified: u.is_verified || false,
      });
    }

    if (!json?.has_more) break;
    nextMaxId = json?.next_max_id;

    // Slower, jittered delay between pages to avoid rate limiting
    await page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), Math.round(baseDelayMs * (0.8 + Math.random() * 0.8)));
  }

  return summaries;
}
