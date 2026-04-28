import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

function isPastEvent(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr + 'T23:59:59') < new Date();
}

export default function EventDetail() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeAgeGroup, setActiveAgeGroup] = useState(null);
  const [copied, setCopied] = useState(false);

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

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const filteredResults = results.filter(r => {
    if (activeCategory && r.category !== activeCategory) return false;
    if (activeAgeGroup && r.age_group !== activeAgeGroup) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!event) return <div className="text-center py-32 text-gray-400">Event not found.</div>;

  const past = isPastEvent(event.event_date);
  const priceDisplay = formatPrice(event.price);
  const isFree = !event.price || event.price === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header card */}
      <div className="card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">

          {/* Left: event info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {parseTypes(event.event_type).map(t => <CategoryBadge key={t} category={t} />)}
              {past && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400 border border-gray-500/30">
                  Completed
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-wide text-white mb-1">
              {event.event_name}
            </h1>
            <p className="text-gray-400 text-base">{event.gym_name}</p>
          </div>

          {/* Right: CTA */}
          <div className="flex flex-col gap-2 shrink-0 sm:items-end">
            {!past ? (
              <>
                <Link to={`/events/${id}/register`} className="btn-primary px-6 py-2.5 text-sm text-center">
                  Register Now
                  {!isFree && <span className="ml-1.5 opacity-70 font-normal">· {priceDisplay}/person</span>}
                </Link>
                {isFree && (
                  <span className="text-green-400 text-xs text-center font-medium">Free registration</span>
                )}
              </>
            ) : (
              <span className="text-gray-500 text-sm font-medium px-4 py-2.5 border border-surface-border rounded-lg">
                Registration Closed
              </span>
            )}

            {/* Share button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-brand">Link copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share event
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-surface-border">
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
            <p className={`font-medium text-sm ${isFree ? 'text-green-400' : 'text-white'}`}>
              {isFree ? 'Free' : `${priceDisplay} per person`}
            </p>
            {event.has_member_pricing && event.member_price !== null && (
              <p className="text-xs text-brand mt-0.5">
                {formatPrice(event.member_price)} for members
              </p>
            )}
          </div>
        </div>

        {event.description && (
          <div className="mt-5 pt-5 border-t border-surface-border">
            <p className="text-gray-400 text-sm leading-relaxed">{event.description}</p>
          </div>
        )}

        {/* Subtle manage link for gym owners */}
        <div className="mt-4 pt-4 border-t border-surface-border/50 text-right">
          <Link to={`/events/${id}/manage`} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Manage this event →
          </Link>
        </div>
      </div>

      {/* Results */}
      <div className="card p-6">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-5">Results</h2>

        {results.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{past ? 'No results recorded' : 'Results are posted as athletes finish — check back on race day'}</p>
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
