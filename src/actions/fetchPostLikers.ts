import { withPage } from "../session";
import { ensureLoggedIn } from "../login";
import { getCredentials } from "../env";
import { PostLikersResult } from "../types";
import { getPostLikers, resolveMediaId } from "../api/instagram";
import { nowIso } from "../utils";
import { saveJsonPost } from "../io/storage";

export async function fetchPostLikers(
  headless = true,
  input: string
): Promise<PostLikersResult> {
  const creds = getCredentials();
  const target = input.trim();
  return withPage(headless, async (page, context) => {
    await ensureLoggedIn(page, context, creds);
    // Derive a human-friendly identifier (prefer shortcode in URL/input)
    let identifier = target;
    const urlMatch = target.match(/instagram\.com\/(?:p|reel)\/([^\/?#]+)/i);
    if (urlMatch) identifier = String(urlMatch[1] || identifier);
    if (!/^[A-Za-z0-9_-]+$/.test(identifier)) identifier = target;

    const mediaId = await resolveMediaId(page, target);
    const { items, totalLikes } = await getPostLikers(page, mediaId);
    const result: PostLikersResult = {
      items,
      total: items.length,
      available: items.length,
      totalLikes,
      fetchedAt: nowIso(),
    };
    await saveJsonPost(identifier, "likers", result);
    return result;
  });
}
