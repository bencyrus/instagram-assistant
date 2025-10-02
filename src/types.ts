export type UserId = string;
export type UserHandle = string;

export type UserSummary = {
  id: UserId;
  username: UserHandle;
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

export type Profile = {
  id: UserId;
  username: UserHandle;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  isVerified?: boolean;
  fetchedAt: string;
};

export type Timestamped<T> = T & { fetchedAt: string };

export type DataKind = "followers" | "followings" | "profile";

export type ConnectionsKind = "followers" | "following";
