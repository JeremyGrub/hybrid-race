import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Leaderboard from '../components/results/Leaderboard';
import CategoryTabs from '../components/results/CategoryTabs';
import { CategoryBadge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
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

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeAgeGroup, setActiveAgeGroup] = useState(null);
  const [pinModal, setPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [ev, res] = await Promise.all([api.getEvent(id), api.getResults(id)]);
        setEvent(ev);
        setResults(res);
        // Default to first category
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

  async function handleManageClick() {
    const cached = sessionStorage.getItem(`event-pin-${id}`);
    if (cached) { navigate(`/events/${id}/manage`); return; }
    setPinModal(true);
  }

  async function handlePinSubmit(e) {
    e.preventDefault();
    setVerifying(true);
    setPinError('');
    try {
      const { valid } = await api.verifyPin(id, pin);
      if (valid) {
        sessionStorage.setItem(`event-pin-${id}`, pin);
        setPinModal(false);
        navigate(`/events/${id}/manage`);
      } else {
        setPinError('Incorrect PIN');
      }
    } catch {
      setPinError('Could not verify PIN');
    } finally {
      setVerifying(false);
    }
  }

  const filteredResults = results.filter(r => {
    if (activeCategory && r.category !== activeCategory) return false;
    if (activeAgeGroup && r.age_group !== activeAgeGroup) return false;
    return true;
  });

  if (loading) return (
    <div className="flex justify-center py-32"><Spinner size="lg" /></div>
  );

  if (!event) return (
    <div className="text-center py-32 text-gray-400">Event not found.</div>
  );

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
          <button onClick={handleManageClick} className="btn-secondary shrink-0">
            Manage Event
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-surface-border">
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
        </div>

        {(event.description || event.registration_link) && (
          <div className="mt-5 pt-5 border-t border-surface-border space-y-3">
            {event.description && (
              <p className="text-gray-400 text-sm leading-relaxed">{event.description}</p>
            )}
            {event.registration_link && (
              <a
                href={event.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 btn-primary text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Register for this Event
              </a>
            )}
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
            <p className="text-sm">No athletes registered yet</p>
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

      {/* PIN modal */}
      <Modal open={pinModal} onClose={() => { setPinModal(false); setPin(''); setPinError(''); }} title="Manage Event">
        <p className="text-gray-400 text-sm mb-4">Enter your event PIN to access the management dashboard.</p>
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            className="input-field text-center tracking-widest text-xl"
            placeholder="••••"
            value={pin}
            onChange={e => { setPin(e.target.value); setPinError(''); }}
            autoFocus
          />
          {pinError && <p className="text-red-400 text-xs">{pinError}</p>}
          <button type="submit" disabled={verifying || !pin} className="btn-primary w-full">
            {verifying ? 'Verifying...' : 'Access Event'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
