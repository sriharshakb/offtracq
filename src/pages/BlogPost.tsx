import { Link, useParams } from "react-router-dom";
import { SiteNav } from "../SiteNav";
import { SiteFooter } from "../SiteFooter";
import { getPost } from "../blog/posts";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BlogPost() {
  const { slug } = useParams();
  const post = slug ? getPost(slug) : undefined;

  return (
    <div className="site">
      <SiteNav />

      <article className="section blog-page blog-post">
        {post ? (
          <>
            <p className="video-date">{formatDate(post.date)}</p>
            <h1>{post.title}</h1>

            {post.cover && (
              <div className="blog-post-cover">
                <img src={post.cover} alt={post.title} />
              </div>
            )}

            <div className="blog-post-body" dangerouslySetInnerHTML={{ __html: post.content }} />
          </>
        ) : (
          <div className="blog-empty">
            <p>That story doesn't exist (yet).</p>
            <Link to="/blog" className="button button-outline">
              BACK TO BLOG
            </Link>
          </div>
        )}
      </article>

      <SiteFooter />
    </div>
  );
}
