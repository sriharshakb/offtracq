import { Link } from "react-router-dom";
import { SiteNav } from "../SiteNav";
import { SiteFooter } from "../SiteFooter";
import { posts } from "../blog/posts";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function Blog() {
  return (
    <div className="site">
      <SiteNav />

      <section className="section blog-page" id="blog">
        <div className="section-header">
          <div>
            <p className="section-kicker">FROM THE ROAD</p>
            <h2>BLOG</h2>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="blog-empty">
            <p>New stories are still being written.</p>
            <p>Check back soon — or watch the latest on YouTube in the meantime.</p>
            <a
              href="https://www.youtube.com/@Offtracq"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-outline"
            >
              WATCH ON YOUTUBE
            </a>
          </div>
        ) : (
          <div className="blog-grid">
            {posts.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="blog-card">
                {post.cover && (
                  <div className="blog-card-image">
                    <img src={post.cover} alt={post.title} loading="lazy" />
                  </div>
                )}
                <p className="video-date">{formatDate(post.date)}</p>
                <h3>{post.title}</h3>
                <p className="blog-card-excerpt">{post.excerpt}</p>
                <span className="watch-link">READ →</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
