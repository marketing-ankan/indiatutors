import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPost } from '../lib/api.js';

// A real article page. The original was WordPress parity for a blog whose only
// post was "Hello world!": raw body HTML between header and footer, no title,
// date, author or image. Now that posts are written in the Staff Console, that
// layout rendered a console post as one unbroken wall of text with no heading —
// the form collects a title, summary, cover and author, and the page showed
// none of them.

/**
 * Post bodies are PLAIN TEXT: blank lines separate paragraphs, single newlines
 * stay as line breaks — exactly what the console's form promises. React escapes
 * everything, so nothing typed or pasted into a body can become markup.
 *
 * There is deliberately no raw-HTML path any more. The only HTML post that ever
 * existed was the seeded WordPress "Hello world!", and it has been retired —
 * keeping dangerouslySetInnerHTML around for content that no longer exists
 * would be pure attack surface.
 */
export function PostBody({ body }) {
  return (
    <div>
      {(body || '').trim().split(/\n\s*\n/).filter(Boolean).map((para, i) => (
        <p key={i} className="my-4 leading-relaxed text-slate-700">
          {para.split('\n').map((line, j, arr) => (
            <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
          ))}
        </p>
      ))}
    </div>
  );
}

/** "2026-08-14" is for machines; readers get "14 Aug 2026". */
export const postDate = iso =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

export default function BlogPostPage() {
  const { slug } = useParams();
  const { data: post, isLoading, isError } = useQuery({ queryKey: ['post', slug], queryFn: () => fetchPost(slug) });

  if (isLoading) return <div className="container-wide py-20 text-slate-500">Loading…</div>;
  if (isError || !post) return (
    <div className="container-wide py-20 text-center">
      <h1 className="text-2xl font-bold">Post not found</h1>
      <Link to="/blog" className="mt-4 inline-block text-brand-600">← Back to the blog</Link>
    </div>
  );

  return (
    <article className="container-wide max-w-3xl py-10">
      <Link to="/blog" className="text-sm font-semibold text-brand-600 hover:underline">← All posts</Link>
      <h1 className="font-heading mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{post.title}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {[postDate(post.published_at), post.author].filter(Boolean).join(' · ')}
      </p>
      {post.image_url && (
        <img src={post.image_url} alt="" className="mt-6 w-full rounded-2xl object-cover" loading="lazy" />
      )}
      <div className="mt-6 text-[1.02rem]">
        <PostBody body={post.body} />
      </div>
    </article>
  );
}
