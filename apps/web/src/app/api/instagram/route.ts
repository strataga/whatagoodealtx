import { NextResponse } from "next/server";
import type { InstagramPost, InstagramResponse, FeaturedItem } from "@/types/instagram";

// Simple in-memory cache
let cachedPosts: FeaturedItem[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

export async function GET() {
  try {
    // Check if we have valid cached data
    if (cachedPosts && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
      console.log("Returning cached Instagram posts");
      return NextResponse.json({ posts: cachedPosts, cached: true });
    }

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const userId = process.env.INSTAGRAM_USER_ID;

    if (!accessToken || !userId) {
      console.error("Instagram credentials not configured");
      return NextResponse.json(
        { error: "Instagram API not configured" },
        { status: 500 }
      );
    }

    // Fetch recent media from Instagram
    const url = `https://graph.instagram.com/${userId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,thumbnail_url&access_token=${accessToken}`;

    console.log("Fetching Instagram posts...");
    const response = await fetch(url, {
      next: { revalidate: 900 }, // Revalidate every 15 minutes
    });

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`);
    }

    const data: InstagramResponse = await response.json();

    // Filter posts that contain #featured hashtag (case insensitive) and get the last 9
    const featuredPosts = data.data
      .filter((post) => {
        const caption = post.caption?.toLowerCase() || "";
        return caption.includes("#featured");
      })
      .slice(0, 9) // Get up to 9 featured posts
      .map((post) => transformToFeaturedItem(post));

    console.log(`Found ${featuredPosts.length} featured Instagram posts`);

    // Update cache
    cachedPosts = featuredPosts;
    cacheTimestamp = Date.now();

    return NextResponse.json({ posts: featuredPosts, cached: false });
  } catch (error) {
    console.error("Error fetching Instagram posts:", error);

    // If we have cached data, return it even if expired
    if (cachedPosts) {
      console.log("Returning stale cached data due to error");
      return NextResponse.json({ posts: cachedPosts, cached: true, stale: true });
    }

    return NextResponse.json(
      { error: "Failed to fetch Instagram posts", details: error },
      { status: 500 }
    );
  }
}

function transformToFeaturedItem(post: InstagramPost): FeaturedItem {
  // Extract title from caption (first line or first sentence)
  const caption = post.caption || "";
  const lines = caption.split("\n").filter((line) => line.trim() && !line.startsWith("#"));
  const title = lines[0] || "Featured Item";

  // Extract description (second line or remaining text, exclude hashtags)
  const description = lines.slice(1).join(" ").split("#")[0].trim() || "Check out this amazing find!";

  return {
    id: post.id,
    title: title.substring(0, 50), // Limit title length
    description: description.substring(0, 150), // Limit description length
    image: post.media_type === "VIDEO" ? (post.thumbnail_url || post.media_url) : post.media_url,
    link: post.permalink,
  };
}
