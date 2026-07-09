import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPost } from '../lib/api.js';

export default function BlogPostPage() {
  const { slug } = useParams();
  const { data: post, isLoading, isError } = useQuery({ queryKey:['post',slug], queryFn:()=>fetchPost(slug) });

  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-20 text-slate-500">Loading…</div>;
  if (isError || !post) return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Post not found</h1>
      <Link to="/blog" className="text-brand-600 mt-4 inline-block">← Back to the blog</Link>
    </div>
  );

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-xs text-slate-500 mb-2">
        <Link to="/" className="hover:text-brand-600">Home</Link> / <Link to="/blog" className="hover:text-brand-600">Blog</Link>
      </div>
      <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">{post.title}</h1>
      <div className="mt-3 text-sm text-slate-400">
        {post.author}{post.published_at && <> · {new Date(post.published_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</>}
      </div>
      {post.image_url && <div className="mt-6 rounded-2xl overflow-hidden aspect-[16/9] bg-slate-100"><img src={post.image_url} alt={post.title} className="w-full h-full object-cover"/></div>}
      <div className="prose prose-slate max-w-none mt-8 prose-headings:font-extrabold prose-h2:text-xl prose-h2:mt-8" dangerouslySetInnerHTML={{ __html: post.body || '' }} />

      <div className="mt-12 rounded-2xl bg-brand-50 ring-1 ring-brand-100 p-6 text-center">
        <h2 className="text-xl font-extrabold">Ready to see it in action?</h2>
        <p className="text-slate-600 mt-1">Book a free demo class and meet a verified tutor.</p>
        <Link to="/book-demo" className="mt-4 inline-block rounded-lg bg-brand-600 text-white px-6 py-3 text-sm font-bold hover:bg-brand-700">Book a Free Demo</Link>
      </div>

      <div className="mt-8"><Link to="/blog" className="text-brand-600 font-semibold hover:underline">← Back to all posts</Link></div>
    </article>
  );
}
