import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Play } from "lucide-react";
import type { YouTubeVideo } from "./types";
import { Thumbnail } from "./Thumbnail";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function Frame({ video, index }: { video: YouTubeVideo; index: number }) {
  return (
    <a
      className="reel-frame"
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="watch"
    >
      <div className="reel-image">
        <Thumbnail src={video.thumbnail} alt={video.title} />
        <span className="reel-number">{String(index + 2).padStart(2, "0")}</span>
        <span className="card-play reel-play">
          <Play size={15} fill="currentColor" strokeWidth={0} />
        </span>
      </div>
      <div className="reel-info">
        <p className="video-date">{formatDate(video.publishedAt)}</p>
        <h3>{video.title}</h3>
      </div>
    </a>
  );
}

// Videos laid out like a strip of film. On desktop the section pins and the
// strip glides sideways as you scroll down; on touch / small screens or with
// reduced motion it becomes a plain swipeable scroll-snap row.
export function FilmReel({ videos }: { videos: YouTubeVideo[] }) {
  const reduceMotion = useReducedMotion();
  const [pinned, setPinned] = useState(false);
  const [travel, setTravel] = useState(0);
  const [frame, setFrame] = useState(1);

  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 901px) and (hover: hover)");
    const sync = () => setPinned(query.matches && !reduceMotion);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [reduceMotion]);

  useEffect(() => {
    if (!pinned) return;
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      setTravel(Math.max(0, track.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pinned, videos.length]);

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -travel]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setFrame(Math.min(videos.length, Math.max(1, Math.round(progress * (videos.length - 1)) + 1)));
  });

  if (!pinned) {
    return (
      <div className="reel-scroller" role="list">
        {videos.map((video, index) => (
          <div role="listitem" className="reel-slot" key={video.id}>
            <Frame video={video} index={index} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="reel-wrap"
      ref={wrapRef}
      // Enough vertical scroll to cover the horizontal travel, plus one screen of dwell.
      style={{ height: `calc(100vh + ${travel}px)` }}
    >
      <div className="reel-sticky">
        <div className="reel-hud">
          <span>FRAME {String(frame).padStart(2, "0")} / {String(videos.length).padStart(2, "0")}</span>
          <span className="reel-hud-rule" />
          <span>SCROLL TO ADVANCE</span>
        </div>
        <motion.div className="reel-track" ref={trackRef} style={{ x }} role="list">
          {videos.map((video, index) => (
            <div role="listitem" className="reel-slot" key={video.id}>
              <Frame video={video} index={index} />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
