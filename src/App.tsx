import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { Compass, Film, Mountain } from "lucide-react";

type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  url: string;
};

type YouTubeData = {
  channelId: string;
  updatedAt: string;
  videos: YouTubeVideo[];
  shorts: YouTubeVideo[];
};

const PILLARS = [
  {
    icon: Mountain,
    title: "ADVENTURE",
    description:
      "Hiking, kayaking, off-roading and via ferrata — chasing routes that make you earn the view.",
  },
  {
    icon: Compass,
    title: "CULTURE & STORIES",
    description:
      "Tribal cultures, spiritual towns and the strange, obsessive things one person can build.",
  },
  {
    icon: Film,
    title: "CINEMATIC FILMS",
    description:
      "Every trip is shot and cut like a short film — not a vlog, a story worth sitting through.",
  },
];

// Reveals its children with a fade/slide-up transition the first time
// they scroll into view. Kept as a plain div wrapper so it can drop into
// existing grid/flex layouts by taking on the caller's className.
function Reveal({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " reveal-visible" : ""}${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {children}
    </div>
  );
}

function Thumbnail({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="thumb-fallback">
        <span>OFFTRACQ</span>
      </div>
    );
  }

  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-block" />
      <div className="skeleton-line skeleton-line-lg" />
      <div className="skeleton-line skeleton-line-sm" />
    </div>
  );
}

function App() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [shorts, setShorts] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/youtube.json")
      .then((response) => response.json())
      .then((data: YouTubeData) => {
        setVideos(data.videos || []);
        setShorts(data.shorts || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Could not load YouTube videos:", error);
        setLoading(false);
        setFailed(true);
      });
  }, []);

  const featuredVideo = videos[0];
  const nextVideos = videos.slice(1, 5);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="site">

      {/* NAVIGATION */}
      <nav className="navbar">
        <div className="nav-container">
          <a href="#" className="logo">
            OFFTRACQ
          </a>

          <div className="nav-links">
            <a href="#videos">Videos</a>
            <a href="#shorts">Shorts</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </nav>


      {/* HERO */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-grain" />

        <div className="hero-content">
          <p className="hero-kicker">GO BEYOND THE OBVIOUS</p>

          <h1>
            TRAVEL.
            <br />
            ADVENTURE.
            <br />
            STORIES.
          </h1>

          <p className="hero-description">
            Exploring places, people and stories that are worth going
            off the beaten path for.
          </p>

          <div className="hero-buttons">
            <a
              href="https://www.youtube.com/@Offtracq"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
            >
              WATCH ON YOUTUBE
            </a>

            <a href="#videos" className="button button-outline">
              EXPLORE
            </a>
          </div>
        </div>

        <div className="hero-scroll">
          SCROLL TO EXPLORE
          <span>↓</span>
        </div>
      </section>


      {/* PILLARS */}
      <section className="pillars-section">
        <div className="pillars-grid">
          {PILLARS.map(({ icon: Icon, title, description }) => (
            <Reveal className="pillar-card" key={title}>
              <Icon className="pillar-icon" strokeWidth={1.25} />
              <h3>{title}</h3>
              <p>{description}</p>
            </Reveal>
          ))}
        </div>
      </section>


      {/* VIDEOS */}
      <section className="section videos-section" id="videos">

        <Reveal className="section-header">
          <div>
            <p className="section-kicker">LATEST FROM OFFTRACQ</p>
            <h2>VIDEOS</h2>
          </div>

          <a
            href="https://www.youtube.com/@Offtracq/videos"
            target="_blank"
            rel="noopener noreferrer"
            className="view-all"
          >
            VIEW ALL →
          </a>
        </Reveal>


        {loading ? (
          <>
            <div className="skeleton-featured">
              <div className="skeleton-block" />
              <div className="skeleton-info">
                <div className="skeleton-line skeleton-line-sm" />
                <div className="skeleton-line skeleton-line-lg" />
                <div className="skeleton-line skeleton-line-lg" />
              </div>
            </div>
            <div className="video-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          </>
        ) : failed ? (
          <div className="loading">COULDN'T LOAD VIDEOS. TRY AGAIN LATER.</div>
        ) : !featuredVideo ? (
          <div className="loading">NO VIDEOS FOUND.</div>
        ) : (
          <>
            {/* FEATURED VIDEO */}
            <Reveal>
              <a
                href={featuredVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="featured-video"
              >
                <div className="featured-image">
                  <Thumbnail src={featuredVideo.thumbnail} alt={featuredVideo.title} />

                  <div className="featured-play">
                    ▶
                  </div>
                </div>

                <div className="featured-info">
                  <p className="video-date">
                    {formatDate(featuredVideo.publishedAt)}
                  </p>

                  <h3>{featuredVideo.title}</h3>

                  <p className="featured-description">
                    {featuredVideo.description
                      ? featuredVideo.description.slice(0, 180)
                      : "Watch the latest Offtracq adventure."}
                    ...
                  </p>

                  <span className="watch-link">
                    WATCH LATEST VIDEO →
                  </span>
                </div>
              </a>
            </Reveal>


            {/* NEXT 4 VIDEOS */}
            <div className="video-grid">
              {nextVideos.map((video, index) => (
                <Reveal
                  className="video-card"
                  style={{ transitionDelay: `${index * 70}ms` }}
                  key={video.id}
                >
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="video-image">
                      <Thumbnail src={video.thumbnail} alt={video.title} />

                      <div className="video-number">
                        {String(index + 2).padStart(2, "0")}
                      </div>

                      <div className="card-play">
                        ▶
                      </div>
                    </div>

                    <div className="video-info">
                      <p className="video-date">
                        {formatDate(video.publishedAt)}
                      </p>

                      <h3>{video.title}</h3>

                      <span className="watch-link">
                        WATCH →
                      </span>
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </section>


      {/* SHORTS */}
      {(loading || shorts.length > 0) && (
        <section className="section shorts-section" id="shorts">

          <Reveal className="section-header">
            <div>
              <p className="section-kicker">QUICK STORIES</p>
              <h2>SHORTS</h2>
            </div>

            <a
              href="https://www.youtube.com/@Offtracq/shorts"
              target="_blank"
              rel="noopener noreferrer"
              className="view-all"
            >
              VIEW ALL →
            </a>
          </Reveal>

          <div className="shorts-grid">

            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div className="skeleton-short" key={index} />
                ))
              : shorts.slice(0, 4).map((video, index) => (
                  <Reveal
                    className="short-card"
                    style={{ transitionDelay: `${index * 70}ms` }}
                    key={`short-${video.id}`}
                  >
                    <a href={video.url} target="_blank" rel="noopener noreferrer">
                      <Thumbnail src={video.thumbnail} alt={video.title} />

                      <div className="short-overlay" />

                      <div className="short-content">
                        <span>
                          SHORT {String(index + 1).padStart(2, "0")}
                        </span>

                        <h3>{video.title}</h3>

                        <p>WATCH →</p>
                      </div>
                    </a>
                  </Reveal>
                ))}

          </div>
        </section>
      )}


      {/* INSTAGRAM */}
      <section className="instagram-section">

        <Reveal className="instagram-content">

          <p className="section-kicker">
            FOLLOW THE JOURNEY
          </p>

          <h2>
            MORE THAN
            <br />
            <span>JUST YOUTUBE.</span>
          </h2>

          <p>
            Behind the scenes, short adventures, photography and
            moments from the road.
          </p>

          <a
            href="https://www.instagram.com/offtracq/"
            target="_blank"
            rel="noopener noreferrer"
            className="button button-primary"
          >
            FOLLOW ON INSTAGRAM
          </a>

        </Reveal>

      </section>


      {/* ABOUT */}
      <section className="about-section" id="about">

        <Reveal className="about-image">
          <img
            src="/images/about.jpg"
            alt="Offtracq"
            loading="lazy"
          />
        </Reveal>

        <Reveal className="about-content">

          <p className="section-kicker">
            ABOUT OFFTRACQ
          </p>

          <h2>
            GO BEYOND
            <br />
            <span>THE OBVIOUS.</span>
          </h2>

          <p>
            Offtracq is about discovering unusual places, chasing
            unexpected stories and experiencing the world from a
            different perspective.
          </p>

          <p>
            From remote trails and hidden places to Native American
            history and the fascinating people who built something
            unforgettable, every journey is an opportunity to
            discover a story worth telling.
          </p>

        </Reveal>

      </section>


      {/* CONTACT */}
      <section className="contact-section" id="contact">

        <Reveal className="contact-inner">
          <p className="section-kicker">
            LET'S CONNECT
          </p>

          <h2>
            HAVE A STORY
            <br />
            <span>WORTH TELLING?</span>
          </h2>

          <p>
            For collaborations, travel ideas or just to say hello.
          </p>

          <a
            href="mailto:sriharsha1.kb@gmail.com"
            className="button button-primary"
          >
            GET IN TOUCH
          </a>
        </Reveal>

      </section>


      {/* FOOTER */}
      <footer className="footer">

        <div className="footer-logo">
          OFFTRACQ
        </div>

        <div className="footer-links">

          <a
            href="https://www.youtube.com/@Offtracq"
            target="_blank"
            rel="noopener noreferrer"
          >
            YouTube
          </a>

          <a
            href="https://www.instagram.com/offtracq/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>

        </div>

        <p>
          © 2026 OFFTRACQ. ALL RIGHTS RESERVED.
        </p>

      </footer>

    </div>
  );
}

export default App;
