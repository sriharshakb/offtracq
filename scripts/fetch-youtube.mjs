import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");

const getEnvFromFile = (name) => {
  if (!fs.existsSync(envPath)) return undefined;
  const env = fs.readFileSync(envPath, "utf8");

  const line = env
    .split("\n")
    .find((line) => line.startsWith(`${name}=`));

  return line?.split("=")[1]?.trim();
};

// Prefer real environment variables (CI/CD secrets) and fall back to a
// local .env file for local development.
const getEnv = (name) => process.env[name] || getEnvFromFile(name);

const API_KEY = getEnv("YOUTUBE_API_KEY");
const CHANNEL_ID = getEnv("YOUTUBE_CHANNEL_ID");

if (!API_KEY || !CHANNEL_ID) {
  throw new Error("Missing YouTube API key or channel ID in .env");
}

async function fetchJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube API error: ${response.status} ${error}`);
  }

  return response.json();
}

async function main() {
  // Get uploads playlist
  const channelURL =
    `https://www.googleapis.com/youtube/v3/channels` +
    `?part=contentDetails` +
    `&id=${CHANNEL_ID}` +
    `&key=${API_KEY}`;

  const channelData = await fetchJSON(channelURL);

  const uploadsPlaylist =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylist) {
    throw new Error("Could not find the channel uploads playlist.");
  }

  // Get latest 50 uploads
  const playlistURL =
    `https://www.googleapis.com/youtube/v3/playlistItems` +
    `?part=snippet` +
    `&playlistId=${uploadsPlaylist}` +
    `&maxResults=50` +
    `&key=${API_KEY}`;

  const playlistData = await fetchJSON(playlistURL);

  const videoIds = playlistData.items
    .map((item) => item.snippet?.resourceId?.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) {
    throw new Error("No videos found.");
  }

  // Get video details including duration
  const videoURL =
    `https://www.googleapis.com/youtube/v3/videos` +
    `?part=snippet,contentDetails` +
    `&id=${videoIds.join(",")}` +
    `&key=${API_KEY}`;

  const videoData = await fetchJSON(videoURL);

  const videos = videoData.items.map((item) => {
    const videoId = item.id;

    const duration = item.contentDetails?.duration || "";

    // Convert ISO 8601 duration to seconds
    const match = duration.match(
      /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
    );

    const hours = Number(match?.[1] || 0);
    const minutes = Number(match?.[2] || 0);
    const seconds = Number(match?.[3] || 0);

    const totalSeconds =
      hours * 3600 +
      minutes * 60 +
      seconds;

    // YouTube Shorts are normally vertical and <= 3 minutes.
    const isShort = totalSeconds <= 180;

    return {
      id: videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,

      thumbnail:
        item.snippet.thumbnails?.maxres?.url ||
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url,

      url: `https://www.youtube.com/watch?v=${videoId}`,

      duration: totalSeconds,
      isShort,
    };
  });

  // Regular videos
  const regularVideos = videos.filter((video) => !video.isShort);

  // Shorts
  const shorts = videos.filter((video) => video.isShort);

  const output = {
    channelId: CHANNEL_ID,
    updatedAt: new Date().toISOString(),
    videos: regularVideos,
    shorts,
  };

  const outputPath = path.resolve("public/youtube.json");

  fs.writeFileSync(
    outputPath,
    JSON.stringify(output, null, 2)
  );

  console.log(`✓ Found ${regularVideos.length} regular videos`);
  console.log(`✓ Found ${shorts.length} possible Shorts`);
  console.log(`✓ Saved to ${outputPath}`);
}

main().catch((error) => {
  console.error("YouTube fetch failed:", error);
  process.exit(1);
});