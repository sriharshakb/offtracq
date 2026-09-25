import { Link } from "react-router-dom";
import { SiteNav } from "../SiteNav";
import { SiteFooter } from "../SiteFooter";

export function NotFound() {
  return (
    <div className="site">
      <SiteNav />

      <main id="main" className="blog-page wrap">
        <header className="blog-head">
          <h1>Off the map.</h1>
        </header>

        <div className="blog-empty">
          <p>This page doesn't exist — the trail you followed may have moved.</p>
          <Link to="/" className="text-link">
            Back to the start
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
