import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCategoriesTree, fetchCourses } from '../lib/api.js';
import CourseCard from '../components/CourseCard.jsx';

export default function CoursesPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const search   = params.get('search') || '';
  const sort     = params.get('sort') || 'popular';
  const page     = parseInt(params.get('page') || '1', 10);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: fetchCategoriesTree,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['courses', { category, search, sort, page }],
    queryFn: () => fetchCourses({ category, search, sort, page, per_page: 12 }),
  });

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const total = data?.meta?.total ?? 0;

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Our Courses</h1>
        <p className="text-slate-500 mt-1">{total} course{total === 1 ? '' : 's'} available</p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        {/* SIDEBAR */}
        <aside className="space-y-6">
          <div>
            <input
              type="search"
              defaultValue={search}
              placeholder="Search courses…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') setParam('search', e.currentTarget.value);
              }}
              className="w-full rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Categories</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <button
                  onClick={() => setParam('category', '')}
                  className={`w-full text-left px-2 py-1.5 rounded ${!category ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  All Categories
                </button>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setParam('category', c.slug)}
                    className={`w-full text-left px-2 py-1.5 rounded flex justify-between items-center ${category === c.slug ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-slate-400">{c.course_count ?? 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* RESULTS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-500">
              {isLoading ? 'Loading…' : `Showing ${data?.data?.length ?? 0} of ${total}`}
            </div>
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-slate-100 h-72 animate-pulse" />
              ))}
            </div>
          ) : data?.data?.length ? (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {data.data.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>

              {/* Pagination */}
              {data.meta && data.meta.last_page > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1">
                  {Array.from({ length: data.meta.last_page }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setParam('page', String(p))}
                      className={`h-9 w-9 rounded-md text-sm font-semibold ${p === data.meta.current_page ? 'bg-brand-600 text-white' : 'ring-1 ring-slate-200 hover:bg-slate-50'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-slate-500">
              No courses found. Try clearing filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
