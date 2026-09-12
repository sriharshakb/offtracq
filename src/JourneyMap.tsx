import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { YouTubeVideo } from "./types";
import { Thumbnail } from "./Thumbnail";

// Hand-placed so the route reads like a natural traverse (up/down) rather
// than a straight line. Percentages of the map's own box.
const POSITIONS = [
  { x: 9, y: 74 },
  { x: 25, y: 30 },
  { x: 42, y: 66 },
  { x: 59, y: 22 },
  { x: 76, y: 62 },
  { x: 91, y: 28 },
];

// Video titles here follow a "Place | Subtitle" or "Place – Subtitle"
// pattern (see scripts/fetch-youtube.mjs output) — pull just the place.
function placeName(title: string) {
  const first = title.split(/\s+[|–-]\s+/)[0];
  return (first || title).trim();
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

type Stop = YouTubeVideo & { place: string; x: number; y: number };

export function JourneyMap({ videos, loading }: { videos: YouTubeVideo[]; loading: boolean }) {
  const stops = useMemo<Stop[]>(
    () =>
      videos.slice(0, POSITIONS.length).map((video, index) => ({
        ...video,
        place: placeName(video.title),
        x: POSITIONS[index].x,
        y: POSITIONS[index].y,
      })),
    [videos]
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = stops.find((stop) => stop.id === activeId) ?? stops[0];
  const pathD = useMemo(() => smoothPath(stops.map(({ x, y }) => ({ x, y }))), [stops]);

  if (!loading && stops.length === 0) return null;

  return (
    <section className="journey-section" id="journey">
      <div className="journey-header">
        <p className="section-kicker">THE ROUTE SO FAR</p>
        <h2>
          EVERY PIN
          <br />
          <span>IS A STORY.</span>
        </h2>
        <p className="journey-intro">
          A running map of the trips behind the channel — tap a marker to
          jump into that story.
        </p>
      </div>

      <div className="journey-map">
        <svg className="journey-contours" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M -5 20 C 20 10, 40 30, 60 15 S 90 5, 105 20" />
          <path d="M -5 45 C 25 55, 45 35, 65 50 S 95 60, 105 45" />
          <path d="M -5 78 C 20 68, 45 88, 70 72 S 95 62, 105 78" />
        </svg>

        {pathD && (
          <svg className="journey-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <motion.path
              d={pathD}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
        )}

        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="journey-pin journey-pin-skeleton"
                style={{ left: `${POSITIONS[index].x}%`, top: `${POSITIONS[index].y}%` }}
              />
            ))
          : stops.map((stop, index) => (
              <button
                key={stop.id}
                type="button"
                className={`journey-pin${active?.id === stop.id ? " journey-pin-active" : ""}`}
                style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                onClick={() => setActiveId(stop.id)}
              >
                {active?.id === stop.id && (
                  <motion.span
                    layoutId="journey-pin-ring"
                    className="journey-pin-ring"
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                  />
                )}
                <span className="journey-pin-dot" />
                <span className="journey-pin-label">
                  {String(index + 1).padStart(2, "0")} — {stop.place}
                </span>
              </button>
            ))}
      </div>

      <AnimatePresence mode="wait">
        {active && (
          <motion.a
            key={active.id}
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            className="journey-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="journey-card-image">
              <Thumbnail src={active.thumbnail} alt={active.title} />
            </div>

            <div className="journey-card-info">
              <p className="video-date">{formatDate(active.publishedAt)}</p>
              <h3>{active.title}</h3>
              <span className="watch-link">WATCH THIS STORY →</span>
            </div>
          </motion.a>
        )}
      </AnimatePresence>
    </section>
  );
}
