import type { Page } from "playwright";
import { InstagramApiClient } from "../core/InstagramApiClient";
import type { Profile, UserSummary, UserId, ConnectionsKind } from "../types";
import { computeDelay, wait } from "../core/pacing";
import { DEFAULTS } from "../config";

export async function getProfile(
  page: Page,
  username: string
): Promise<Profile> {
  const client = new InstagramApiClient(page);
  return client.getProfile(username);
}

export async function resolveUserId(
  page: Page,
  username: string
): Promise<UserId> {
  const client = new InstagramApiClient(page);
  return client.resolveUserId(username);
}

export async function getConnections(
  page: Page,
  kind: ConnectionsKind,
  userId: UserId,
  opts?: { pageSize?: number; maxPages?: number; baseDelayMs?: number }
): Promise<UserSummary[]> {
  const client = new InstagramApiClient(page);
  return client.getConnections(kind, userId, {
    pageSize: opts?.pageSize ?? DEFAULTS.pageSize,
    maxPages: opts?.maxPages ?? DEFAULTS.maxPages,
    baseDelayMs: opts?.baseDelayMs ?? DEFAULTS.baseDelayMs,
    wait: wait,
    computeDelay: computeDelay,
  });
}

export async function getFollowers(
  page: Page,
  userId: UserId,
  opts?: { pageSize?: number; maxPages?: number; baseDelayMs?: number }
): Promise<UserSummary[]> {
  return getConnections(page, "followers", userId, opts);
}

export async function getFollowing(
  page: Page,
  userId: UserId,
  opts?: { pageSize?: number; maxPages?: number; baseDelayMs?: number }
): Promise<UserSummary[]> {
  return getConnections(page, "following", userId, opts);
}

export async function resolveMediaId(
  page: Page,
  input: string
): Promise<string> {
  const client = new InstagramApiClient(page);
  return client.resolveMediaId(input);
}

export async function getPostLikers(
  page: Page,
  mediaId: string
): Promise<{ items: UserSummary[]; totalLikes: number }> {
  const client = new InstagramApiClient(page);
  return client.getPostLikers(mediaId);
}
