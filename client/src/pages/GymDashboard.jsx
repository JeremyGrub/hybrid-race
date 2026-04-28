import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getToken, getStoredGym, setStoredGym, clearToken } from '../api/client';
import EventCard from '../components/events/EventCard';
import Spinner from '../components/ui/Spinner';

export default function GymDashboard() {
  const navigate = useNavigate();
  const [gym, setGym] = useState(getStoredGym());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');

  useEffect(() => {
    if (!getToken()) { navigate('/login', { replace: true }); return; }

    async function load() {
      try {
        // Refresh gym data
        const { gym: freshGym } = await api.getMe();
        setGym(freshGym);
        setStoredGym(freshGym);

        // Load this gym's events
        const ev = await api.getEvents({ gym_id: freshGym.id });
        setEvents(ev);
      } catch(err) {
        if (err.message.includes('401') || err.message.includes('Authentication')) {
          clearToken();
          navigate('/login', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  async function handleStripeConnect() {
    setStripeLoading(true);
    setStripeError('');
    try {
      const { url } = await api.stripeConnect();
      window.location.href = url;
    } catch(err) {
      setStripeError(err.message);
      setStripeLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;

  const paidCount = events.reduce((sum, e) => sum + (e.registration_count || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide text-white">
            {gym?.gym_name}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{gym?.location} &middot; {gym?.email}</p>
        </div>
        <Link to="/create" className="btn-primary shrink-0">
          + Create Event
        </Link>
      </div>

      {/* Stripe Connect status */}
      <div className="card p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stripe Payments</p>
          {gym?.stripe_onboarding_complete ? (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-green-400 font-medium text-sm">Stripe Connected</span>
            </div>
          ) : (
            <p className="text-gray-300 text-sm">
              {gym?.stripe_account_id
                ? 'Onboarding incomplete — finish connecting Stripe to accept payments'
                : 'Connect Stripe to accept paid registrations'}
            </p>
          )}
        </div>
        {!gym?.stripe_onboarding_complete && (
          <div>
            <button
              onClick={handleStripeConnect}
              disabled={stripeLoading}
              className="btn-primary shrink-0"
            >
              {stripeLoading ? 'Redirecting...' : gym?.stripe_account_id ? 'Continue Stripe Setup' : 'Connect Stripe'}
            </button>
            {stripeError && <p className="text-red-400 text-xs mt-1">{stripeError}</p>}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Events', value: events.length },
          { label: 'Total Athletes', value: events.reduce((s, e) => s + (e.racer_count || 0), 0) },
          { label: 'Paid Registrations', value: paidCount },
        ].map(stat => (
          <div key={stat.label} className="card p-5 text-center">
            <p className="font-display text-3xl font-bold text-brand">{stat.value}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Events grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-gray-200">Your Events</h2>
      </div>

      {events.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-gray-500 mb-4">No events yet.</p>
          <Link to="/create" className="btn-primary">Create Your First Event</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(event => (
            <div key={event.id} className="flex flex-col gap-2">
              <EventCard event={event} />
              <div className="flex gap-2 px-1">
                <Link
                  to={`/events/${event.id}/manage`}
                  className="btn-secondary text-xs py-1.5 flex-1 text-center"
                >
                  Manage
                </Link>
                <Link
                  to={`/events/${event.id}/register`}
                  className="btn-ghost text-xs py-1.5 flex-1 text-center border border-surface-border rounded-lg"
                >
                  Register Link
                </Link>
              </div>
              {(event.registration_count || 0) > 0 && (
                <p className="text-xs text-gray-500 px-1">
                  {event.registration_count} paid registration{event.registration_count !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
