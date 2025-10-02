export type InstagramUserSummary = {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  isVerified?: boolean;
};

export type ScrapeResult<T> = {
  items: T[];
  total: number;
  fetchedAt: string; // ISO timestamp
};

export type Credentials = {
  username: string;
  password: string;
};

export type ProfileInfo = {
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  isVerified?: boolean;
  fetchedAt: string;
};

export type ActionName = "login" | "followers" | "followings" | "profile";

export type DataKind = "followers" | "followings" | "profile";
