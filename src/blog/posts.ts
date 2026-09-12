export type BlogPost = {
  slug: string;
  title: string;
  date: string; // ISO date, e.g. "2026-09-12"
  excerpt: string;
  cover?: string; // e.g. "/images/hero.jpg"
  content: string; // plain text / simple HTML, rendered as-is
};

// Add new posts here, newest first. Each one automatically gets a card on
// /blog and its own page at /blog/<slug> — nothing else to wire up.
//
// Example:
// {
//   slug: "everest-base-camp-diary",
//   title: "Everest Base Camp: The Diary",
//   date: "2026-09-01",
//   excerpt: "Three weeks, one trail, and a mountain that doesn't care how ready you think you are.",
//   cover: "/images/hero.jpg",
//   content: "<p>Full post body goes here...</p>",
// },
export const posts: BlogPost[] = [];

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}
