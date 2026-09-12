import { motion, useScroll } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

// Section anchors only exist on the home page. From anywhere else, prefix
// them with "/" so the browser goes back to the homepage first.
function useSectionHref() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  return (hash: string) => (isHome ? hash : `/${hash}`);
}

export function SiteNav() {
  const { scrollYProgress } = useScroll();
  const sectionHref = useSectionHref();

  return (
    <nav className="navbar">
      <motion.div className="nav-progress" style={{ scaleX: scrollYProgress }} />

      <div className="nav-container">
        <Link to="/" className="logo">
          OFFTRACQ
        </Link>

        <div className="nav-links">
          <a href={sectionHref("#journey")}>Journey</a>
          <a href={sectionHref("#videos")}>Videos</a>
          <a href={sectionHref("#shorts")}>Shorts</a>
          <a href={sectionHref("#about")}>About</a>
          <Link to="/blog">Blog</Link>
          <a href={sectionHref("#contact")}>Contact</a>
        </div>
      </div>
    </nav>
  );
}
