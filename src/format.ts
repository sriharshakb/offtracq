// Presentation helpers for the raw YouTube data. YouTube titles are written
// for the YouTube search box ("Place | Hook | Telugu"); on the site they read
// better as a title plus a subtitle, with the language called out separately.

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function parseTitle(raw: string) {
  const telugu = /telugu/i.test(raw);
  const cleaned = raw.replace(/\s*[|–-]\s*telugu\b.*$/i, "").trim();
  const match = cleaned.match(/^(.+?)(?:\s+[|–-]\s+|:\s+)(.+)$/);
  return {
    title: match ? match[1] : cleaned,
    deck: match ? match[2] : "",
    telugu,
  };
}

// Shorts titles double as hashtag lists — keep just the sentence.
export function cleanShortTitle(raw: string) {
  const text = raw.replace(/#[\p{L}\p{N}_-]+/gu, "").replace(/\s+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// First real paragraph of a description, without markdown, links or the
// "Welcome to another adventure" boilerplate, trimmed on a word boundary.
export function excerpt(description: string, max = 220) {
  const paragraph =
    description
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\*\*/g, "").replace(/https?:\/\/\S+/g, "").replace(/#[\p{L}\p{N}_-]+/gu, "").trim())
      .find((p) => p.length > 40 && !/^welcome to/i.test(p)) ?? "";

  if (paragraph.length <= max) return paragraph;
  return `${paragraph.slice(0, paragraph.lastIndexOf(" ", max))}…`;
}
