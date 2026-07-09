import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPosts } from '../lib/api.js';

export default function BlogPage() {
  const { data, isLoading } = useQuery({ queryKey:['posts'], queryFn:()=>fetchPosts({ per_page:12 }) });
  const posts = data?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Learning Hub</p>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">The IndiaTutors Blog</h1>
        <p className="text-slate-500 mt-2">Practical advice on tutoring, study skills and helping your child learn.</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-6">{Array.from({length:4}).map((_,i)=><div key={i} className="rounded-2xl bg-slate-100 h-72 animate-pulse"/>)}</div>
      ) : posts.length ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {posts.map(p => (
            <Link key={p.id} to={`/blog/${p.slug}`} className="group block rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
              {p.image_url && <div className="aspect-[16/9] bg-slate-100 overflow-hidden"><img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"/></div>}
              <div className="p-5">
                {p.published_at && <div className="text-xs text-slate-400 mb-1.5">{new Date(p.published_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>}
                <h2 className="font-bold text-lg text-slate-900 leading-snug group-hover:text-brand-700">{p.title}</h2>
                {p.excerpt && <p className="mt-2 text-sm text-slate-600 line-clamp-3">{p.excerpt}</p>}
                <span className="mt-3 inline-block text-sm font-semibold text-brand-600">Read more →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 py-20 text-center">No posts yet — check back soon.</p>
      )}
    </div>
  );
}
