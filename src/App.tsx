import { useEffect, useRef, useState } from "react";
import type { FormEvent, HTMLAttributes, ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { Variants } from "framer-motion";
import { Compass, Film, Mountain, Play } from "lucide-react";
import type { YouTubeData, YouTubeVideo } from "./types";
import { Thumbnail } from "./Thumbnail";
import { MagneticLink } from "./Magnetic";
import { WorldMap } from "./WorldMap";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

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

const heroLineVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const heroContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

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

type FormStatus = "idle" | "submitting" | "success" | "error";

function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!WEB3FORMS_ACCESS_KEY) {
      console.error("VITE_WEB3FORMS_ACCESS_KEY is not configured.");
      setStatus("error");
      return;
    }

    const form = event.currentTarget;
    setStatus("submitting");

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Form submission failed");

      setStatus("success");
      form.reset();
    } catch (error) {
      console.error("Could not send message:", error);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <p className="form-success">
        Thanks — your message is on its way. I'll get back to you soon.
      </p>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <input type="hidden" name="access_key" value={WEB3FORMS_ACCESS_KEY} />
      <input type="hidden" name="subject" value="New message from offtracq.com" />

      {/* Honeypot field: hidden from real visitors, filled in by spam bots. */}
      <input
        type="checkbox"
        name="botcheck"
        className="hp-field"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="form-field">
        <label htmlFor="contact-email">YOUR EMAIL</label>
        <input
          id="contact-email"
          type="email"
          name="email"
          required
          placeholder="you@example.com"
        />
      </div>

      <div className="form-field">
        <label htmlFor="contact-message">MESSAGE</label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          placeholder="Tell me about your idea, story or trip..."
        />
      </div>

      <button
        type="submit"
        className="button button-primary"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "SENDING..." : "SEND MESSAGE"}
      </button>

      {status === "error" && (
        <p className="form-error">
          Something went wrong sending that. Please try again, or reach out
          on Instagram instead.
        </p>
      )}
    </form>
  );
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

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const reduceMotion = useReducedMotion();
  const heroY = useTransform(heroProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["0%", "18%"]);

  // On a pure client-rendered page, the browser's one-shot "scroll to
  // #hash" attempt fires before React has rendered anything, so it
  // silently does nothing — do it ourselves once mounted (covers a
  // fresh load of e.g. /#about, and landing here from another page).
  useEffect(() => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    target?.scrollIntoView();
  }, []);

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

      <SiteNav />


      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <motion.div className="hero-bg" style={{ y: heroY }} />
        <div className="hero-overlay" />

        <motion.div
          className="hero-content"
          variants={heroContainerVariants}
          initial={reduceMotion ? undefined : "hidden"}
          animate="visible"
        >
          <motion.p className="hero-kicker" variants={heroLineVariants}>
            GO BEYOND THE OBVIOUS
          </motion.p>

          <h1>
            <motion.span style={{ display: "block" }} variants={heroLineVariants}>
              TRAVEL.
            </motion.span>
            <motion.span style={{ display: "block" }} variants={heroLineVariants}>
              ADVENTURE.
            </motion.span>
            <motion.span style={{ display: "block" }} variants={heroLineVariants}>
              STORIES.
            </motion.span>
          </h1>

          <motion.p className="hero-description" variants={heroLineVariants}>
            Exploring places, people and stories that are worth going
            off the beaten path for.
          </motion.p>

          <motion.div className="hero-buttons" variants={heroLineVariants}>
            <MagneticLink
              href="https://www.youtube.com/@Offtracq"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
            >
              WATCH ON YOUTUBE
            </MagneticLink>

            <MagneticLink href="#videos" className="button button-outline">
              EXPLORE
            </MagneticLink>
          </motion.div>
        </motion.div>

        <div className="hero-scroll">
          SCROLL TO EXPLORE
          <span>↓</span>
        </div>
      </section>


      {/* JOURNEY MAP */}
      <WorldMap />


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
                    <Play size={20} fill="currentColor" strokeWidth={0} />
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
                        <Play size={15} fill="currentColor" strokeWidth={0} />
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

          <MagneticLink
            href="https://www.instagram.com/offtracq/"
            target="_blank"
            rel="noopener noreferrer"
            className="button button-primary"
          >
            FOLLOW ON INSTAGRAM
          </MagneticLink>

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
          <img
            src="/images/about-2.jpg"
            alt="Standing beside a waterfall deep in a desert canyon"
            loading="lazy"
          />
          <img
            src="/images/about-3.jpg"
            alt="Overlooking dramatic badlands from a rock outcrop"
            loading="lazy"
          />
          <img
            src="/images/about-4.jpg"
            alt="Riding a snowmobile through a snow-covered forest"
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

          <ContactForm />
        </Reveal>

      </section>


      <SiteFooter />

    </div>
  );
}

export default App;
