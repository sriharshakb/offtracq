export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  url: string;
};

export type YouTubeData = {
  channelId: string;
  updatedAt: string;
  videos: YouTubeVideo[];
  shorts: YouTubeVideo[];
};
