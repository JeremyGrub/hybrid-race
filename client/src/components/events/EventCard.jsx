import { Link } from 'react-router-dom';
import { CategoryBadge } from '../ui/Badge';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseTypes(event_type) {
  if (!event_type) return [];
  try {
    const parsed = JSON.parse(event_type);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [event_type];
  }
}

export default function EventCard({ event }) {
  const types = parseTypes(event.event_type);

  return (
    <Link to={`/events/${event.id}`} className="card p-5 block hover:border-brand/30 hover:bg-surface/80 transition-all duration-150 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white group-hover:text-brand transition-colors truncate">
            {event.event_name}
          </h3>
          <p className="text-gray-400 text-sm mt-0.5">{event.gym_name}</p>
        </div>
      </div>

      {/* Type badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {types.map(t => <CategoryBadge key={t} category={t} />)}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.location}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(event.event_date)}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.racer_count ?? 0} {event.racer_count === 1 ? 'racer' : 'racers'}
        </span>
      </div>
    </Link>
  );
}
