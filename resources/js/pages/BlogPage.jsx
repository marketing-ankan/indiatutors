import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPosts } from '../lib/api.js';
import { postDate } from './BlogPostPage.jsx';

// The blog index as a real index. The original dumped every post's FULL body
// onto one page with no titles, no cards and no links — WordPress parity for a
// blog whose only post was "Hello world!". With posts now written in the Staff
// Console, readers need what every blog index gives them: a card per post that
// links to it, and pagination the API has offered all along.

// Exported: the homepage's Latest News section renders the same three-line
// summary for its post cards.
export function excerptOf(p) {
  if (p.excerpt) return p.excerpt;
  // No summary written — first ~150 chars of the body, tags stripped for the
  // legacy HTML posts.
  const plain = (p.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length > 150 ? plain.slice(0, 150).replace(/\s+\S*$/, '') + '…' : plain;
}

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => fetchPosts({ per_page: 9, page }),
    placeholderData: prev => prev,
  });
  const posts = data?.data ?? [];
  const meta = data?.meta;

  if (isLoading && !posts.length) return <div className="container-wide py-20 text-slate-500">Loading…</div>;

  return (
    <div className="container-wide py-10">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900">Blog</h1>
      <p className="mt-1 text-slate-500">Study tips, exam updates and stories from our classrooms.</p>

      {!posts.length ? (
        <p className="py-20 text-center text-slate-500">No posts yet — check back soon.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(p => (
            <Link key={p.id} to={`/blog/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#E7E7EF] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl">
              {p.image_url
                ? <img src={p.image_url} alt="" loading="lazy" className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                : <span className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] font-heading text-4xl font-bold text-white/90">{(p.title || '?')[0]}</span>}
              <span className="flex flex-1 flex-col p-5">
                <span className="font-heading text-lg font-bold leading-snug text-slate-900 group-hover:text-brand-700">{p.title}</span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{excerptOf(p)}</span>
                <span className="mt-3 text-xs text-slate-400">{[postDate(p.published_at), p.author].filter(Boolean).join(' · ')}</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      {meta?.last_page > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40">← Newer</button>
          <span className="text-sm text-slate-500">Page {meta.current_page} of {meta.last_page}</span>
          <button type="button" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40">Older →</button>
        </div>
      )}
    </div>
  );
}
