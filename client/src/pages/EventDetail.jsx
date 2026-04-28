import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import Leaderboard from '../components/results/Leaderboard';
import CategoryTabs from '../components/results/CategoryTabs';
import { CategoryBadge } from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

function parseTypes(event_type) {
  if (!event_type) return [];
  try {
    const parsed = JSON.parse(event_type);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [event_type];
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatPrice(cents) {
  if (!cents || cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeAgeGroup, setActiveAgeGroup] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [ev, res] = await Promise.all([api.getEvent(id), api.getResults(id)]);
        setEvent(ev);
        setResults(res);
        const cats = [...new Set(res.map(r => r.category))];
        if (cats.length) setActiveCategory(cats[0]);
      } catch {
        // handled below
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const filteredResults = results.filter(r => {
    if (activeCategory && r.category !== activeCategory) return false;
    if (activeAgeGroup && r.age_group !== activeAgeGroup) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!event) return <div className="text-center py-32 text-gray-400">Event not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {parseTypes(event.event_type).map(t => <CategoryBadge key={t} category={t} />)}
            </div>
            <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide text-white mb-1">
              {event.event_name}
            </h1>
            <p className="text-gray-400 text-lg">{event.gym_name}</p>
          </div>
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <Link to={`/events/${id}/register`} className="btn-primary">
              Register Now
            </Link>
            <Link to={`/events/${id}/manage`} className="btn-secondary text-xs text-center">
              Manage Event
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-surface-border">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date</p>
            <p className="text-white font-medium text-sm">{formatDate(event.event_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Location</p>
            <p className="text-white font-medium text-sm">{event.location}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Athletes</p>
            <p className="text-white font-medium text-sm">{event.racer_count ?? 0} registered</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Registration</p>
            <p className={`font-medium text-sm ${event.price ? 'text-white' : 'text-green-400'}`}>
              {formatPrice(event.price)}
            </p>
          </div>
        </div>

        {event.description && (
          <div className="mt-5 pt-5 border-t border-surface-border">
            <p className="text-gray-400 text-sm leading-relaxed">{event.description}</p>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="card p-6">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-5">Results</h2>

        {results.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No results yet</p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <CategoryTabs
                results={results}
                activeCategory={activeCategory}
                onCategoryChange={(cat) => { setActiveCategory(cat); setActiveAgeGroup(null); }}
                activeAgeGroup={activeAgeGroup}
                onAgeGroupChange={setActiveAgeGroup}
              />
            </div>
            <Leaderboard results={filteredResults} showCategory={!activeCategory} />
          </>
        )}
      </div>
    </div>
  );
}
