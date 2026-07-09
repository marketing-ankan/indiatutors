import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { fetchCategoriesTree, fetchCourses } from '../lib/api.js';
import CourseCard from '../components/CourseCard.jsx';

// Find a category (and its root) anywhere in the tree by slug
function locate(tree, slug) {
  for (const root of tree) {
    if (root.slug === slug) return { node: root, root };
    for (const child of root.children || []) {
      if (child.slug === slug) return { node: child, root };
    }
  }
  return null;
}

export default function CoursesPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const search   = params.get('search') || '';
  const sort     = params.get('sort') || 'popular';
  const page     = parseInt(params.get('page') || '1', 10);
  const priceMin = params.get('price_min') || '';
  const priceMax = params.get('price_max') || '';

  const { data: categories = [] } = useQuery({ queryKey:['categories','tree'], queryFn: fetchCategoriesTree });
  const { data, isLoading } = useQuery({
    queryKey: ['courses', { category, search, sort, page, priceMin, priceMax }],
    queryFn: () => fetchCourses({ category, search, sort, page, price_min:priceMin, price_max:priceMax, per_page:12 }),
  });

  const setPrice = (min, max) => {
    const next = new URLSearchParams(params);
    min ? next.set('price_min', min) : next.delete('price_min');
    max ? next.set('price_max', max) : next.delete('price_max');
    next.delete('page');
    setParams(next);
  };
  const PRICE_BUCKETS = [['All prices','',''],['Under ₹500','','500'],['₹500 – ₹1,000','500','1000'],['Over ₹1,000','1000','']];

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const total = data?.meta?.total ?? 0;
  const located = category ? locate(categories, category) : null;
  const activeCat = located?.node;
  const activeRootSlug = located?.root?.slug;
  const inp = "w-full rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  const CatButton = ({ c, child = false }) => (
    <button onClick={()=>setParam('category', c.slug)}
      className={`w-full text-left rounded flex justify-between items-center ${child ? 'pl-6 pr-2 py-1 text-[13px]' : 'px-2 py-1.5'} ${category===c.slug?'bg-brand-50 text-brand-700 font-semibold':'text-slate-700 hover:bg-slate-50'}`}>
      <span>{c.name}</span>
      {c.course_count != null && <span className="text-xs text-slate-400">{c.course_count}</span>}
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <div className="text-xs text-slate-500 mb-1">
          <button onClick={()=>setParam('category','')} className="hover:text-brand-600">Courses</button>
          {located?.root && located.root.slug !== category && <> / {located.root.name}</>}
          {activeCat && <> / {activeCat.name}</>}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">{activeCat ? activeCat.name : 'Our Courses'}</h1>
        <p className="text-slate-500 mt-1">
          {activeCat?.description || `${total} course${total===1?'':'s'} available`}
        </p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="space-y-5">
          <input type="search" defaultValue={search} placeholder="Search courses…"
            onKeyDown={e=>{ if(e.key==='Enter') setParam('search', e.currentTarget.value); }}
            className={inp} />
          <div>
            <h3 className="font-semibold text-sm mb-3">Categories</h3>
            <ul className="space-y-0.5 text-sm">
              <li><button onClick={()=>setParam('category','')} className={`w-full text-left px-2 py-1.5 rounded ${!category?'bg-brand-50 text-brand-700 font-semibold':'text-slate-700 hover:bg-slate-50'}`}>All Categories</button></li>
              {categories.map(c=>(
                <li key={c.id}>
                  <CatButton c={c} />
                  {(activeRootSlug === c.slug) && c.children?.length > 0 && (
                    <ul className="mt-0.5 space-y-0.5 border-l border-slate-100 ml-2">
                      {c.children.map(ch => <li key={ch.id}><CatButton c={ch} child /></li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-3">Price</h3>
            <ul className="space-y-0.5 text-sm">
              {PRICE_BUCKETS.map(([label, min, max]) => {
                const active = priceMin === min && priceMax === max;
                return <li key={label}><button onClick={()=>setPrice(min, max)} className={`w-full text-left px-2 py-1.5 rounded ${active?'bg-brand-50 text-brand-700 font-semibold':'text-slate-700 hover:bg-slate-50'}`}>{label}</button></li>;
              })}
            </ul>
          </div>
        </aside>

        <div>
          {/* Active filters */}
          {(category || search || priceMin || priceMax) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-slate-400">Filters:</span>
              {(priceMin || priceMax) && (
                <button onClick={()=>setPrice('','')} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200">
                  {PRICE_BUCKETS.find(([,mn,mx])=>mn===priceMin&&mx===priceMax)?.[0] || `₹${priceMin||'0'}–${priceMax||'∞'}`} <X className="h-3 w-3" />
                </button>
              )}
              {search && (
                <button onClick={()=>setParam('search','')} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200">
                  “{search}” <X className="h-3 w-3" />
                </button>
              )}
              {activeCat && (
                <button onClick={()=>setParam('category','')} className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium hover:bg-brand-100">
                  {activeCat.name} <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-500">{isLoading?'Loading…':`Showing ${data?.data?.length??0} of ${total}`}</div>
            <select value={sort} onChange={e=>setParam('sort',e.target.value)} className="rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none">
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{Array.from({length:6}).map((_,i)=><div key={i} className="rounded-xl bg-slate-100 h-72 animate-pulse"/>)}</div>
          ) : data?.data?.length ? (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{data.data.map(c=><CourseCard key={c.id} course={c}/>)}</div>
              {data.meta?.last_page > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1 flex-wrap">
                  {Array.from({length:data.meta.last_page},(_,i)=>i+1).map(p=>(
                    <button key={p} onClick={()=>setParam('page',String(p))} className={`h-9 w-9 rounded-md text-sm font-semibold ${p===data.meta.current_page?'bg-brand-600 text-white':'ring-1 ring-slate-200 hover:bg-slate-50'}`}>{p}</button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-slate-500">
              No courses found.
              <button onClick={()=>setParams(new URLSearchParams())} className="ml-2 text-brand-600 font-semibold hover:underline">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
