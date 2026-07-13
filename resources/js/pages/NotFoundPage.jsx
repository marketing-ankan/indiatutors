import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPost } from '../lib/api.js';
import { PostBody } from './BlogPostPage.jsx';

export default function NotFoundPage() {
  const { pathname } = useLocation();
  // WP URL parity: live post permalinks are top-level (e.g. /hello-world/),
  // so before 404ing a single-segment path, try resolving it as a post slug.
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  const couldBePost = /^[a-z0-9][a-z0-9-]*$/i.test(slug);
  const { data: post, isLoading } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => fetchPost(slug),
    enabled: couldBePost,
    retry: false,
  });

  if (couldBePost && isLoading) return null;
  if (post) return <PostBody html={post.body} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 text-center">
      <div className="text-6xl font-extrabold text-brand-600">404</div>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="inline-flex mt-6 rounded-md bg-brand-600 text-white px-6 py-2.5 text-sm font-bold hover:bg-brand-700">Back to homepage</Link>
    </div>
  );
}
