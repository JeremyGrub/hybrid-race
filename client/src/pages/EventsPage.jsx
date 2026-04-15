import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import EventCard from '../components/events/EventCard';
import Spinner from '../components/ui/Spinner';

const EVENT_TYPES = ['Solo Men', 'Solo Women', 'Doubles Men', 'Doubles Women', 'Doubles Mixed', 'Relay'];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter) params.type = typeFilter;
      const data = await api.getEvents(params);
      setEvents(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="section-title mb-1">Events</h1>
        <p className="text-gray-400 text-sm">Find a sim race event near you</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events, gyms, locations..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="">All types</option>
          {EVENT_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400 font-medium mb-2">No events found</p>
          <p className="text-gray-600 text-sm">
            {search || typeFilter ? 'Try adjusting your filters' : 'Be the first to create one!'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
