import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTutorFilters } from '../lib/api.js';
import FindTutorsPage from './FindTutorsPage.jsx';

// Live-parity /subject/{slug} tutor archive (e.g. /subject/piano,
// /subject/violin-viola): the find-tutors directory pre-filtered to the
// subject. Live taxonomy slugs don't always equal a tutor subject string,
// so map those to the tutor-subject term the filter actually matches on.
const FILTER_TERM = {
  'violin-viola': 'Violin',
  'artificial-intelligence': 'AI & Machine Learning',
  'english-literature': 'English',
};
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function SubjectPage() {
  const { slug } = useParams();
  const { data: filters, isLoading } = useQuery({ queryKey: ['tutor-filters'], queryFn: fetchTutorFilters });
  if (isLoading) return <div className="container-wide py-20 text-slate-500">Loading tutors…</div>;
  const label = FILTER_TERM[slug]
    || (filters?.subjects ?? []).find(s => slugify(s) === slug)
    || slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  return <FindTutorsPage subjectOverride={label} />;
}
