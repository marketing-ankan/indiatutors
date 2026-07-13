import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPost } from '../lib/api.js';

// Live parity: the live post template (/hello-world/) renders ONLY the post
// content between the global header and pre-footer/footer — no title, date,
// author, featured image or comments, and the theme zeroes every horizontal
// gutter so the content sits full-width.
export function PostBody({ html }) {
  return (
    <main className="w-full [&_p]:my-4">
      <div className="entry-content" dangerouslySetInnerHTML={{ __html: html || '' }} />
    </main>
  );
}

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

  return <PostBody html={post.body} />;
}
