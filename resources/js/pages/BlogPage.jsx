import { useQuery } from '@tanstack/react-query';
import { fetchPosts } from '../lib/api.js';
import { PostBody } from './BlogPostPage.jsx';

// Live parity: the live /blog/ page is the default WP posts index rendered by
// this theme as bare post content — no hero, titles, cards or pagination.
export default function BlogPage() {
  const { data, isLoading } = useQuery({ queryKey: ['posts'], queryFn: () => fetchPosts({ per_page: 12 }) });
  const posts = data?.data ?? [];

  if (isLoading) return <div className="container-wide py-20 text-slate-500">Loading…</div>;
  if (!posts.length) return <div className="container-wide py-20 text-center text-slate-500">No posts yet — check back soon.</div>;

  return (
    <>
      {posts.map(p => <PostBody key={p.id} html={p.body} />)}
    </>
  );
}
