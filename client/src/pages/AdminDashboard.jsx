import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getToken, getStoredGym, clearToken } from '../api/client';
import Spinner from '../components/ui/Spinner';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatPrice(cents) {
  if (!cents || cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const gym = getStoredGym();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!getToken() || !gym?.is_admin) {
      navigate('/login', { replace: true });
      return;
    }
    api.getAdminOverview()
      .then(setData)
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setLoading(false));
  }, [navigate]);

  function handleLogout() {
    clearToken();
    window.location.href = '/';
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!data) return null;

  const filteredEvents = data.events.filter(e =>
    !search ||
    e.event_name.toLowerCase().includes(search.toLowerCase()) ||
    e.gym_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalRegistrations = data.events.reduce((s, e) => s + (e.registration_count || 0), 0);
  const totalRacers = data.events.reduce((s, e) => s + (e.racer_count || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs text-brand bg-brand/10 border border-brand/20 rounded-full px-3 py-1">
              ⚡ Admin
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide">RaceGrid Admin</h1>
          <p className="text-gray-400 text-sm mt-0.5">Platform overview</p>
        </div>
        <button onClick={handleLogout} className="btn-ghost text-sm text-gray-500 hover:text-red-400">
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Gyms', value: data.gyms.length },
          { label: 'Events', value: data.events.length },
          { label: 'Athletes', value: totalRacers },
          { label: 'Paid Regs', value: totalRegistrations },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <p className="font-display text-3xl font-bold text-brand">{s.value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Gyms */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-surface-border">
          <h2 className="font-display text-base font-bold uppercase tracking-wide">Gyms ({data.gyms.length})</h2>
        </div>
        {data.gyms.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No gyms yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left py-3 px-5 text-xs text-gray-400 uppercase tracking-wider">Gym</th>
                <th className="text-left py-3 px-5 text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="text-left py-3 px-5 text-xs text-gray-400 uppercase tracking-wider hidden md:table-cell">Location</th>
                <th className="text-left py-3 px-5 text-xs text-gray-400 uppercase tracking-wider">Events</th>
                <th className="text-left py-3 px-5 text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">Stripe</th>
                <th className="text-left py-3 px-5 text-xs text-gray-400 uppercase tracking-wider hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.gyms.map(g => (
                <tr key={g.id} className="border-b border-surface-border/50 hover:bg-surface-raised/30">
                  <td className="py-3 px-5 font-medium text-white">{g.gym_name}</td>
                  <td className="py-3 px-5 text-gray-400 hidden sm:table-cell">{g.email}</td>
                  <td className="py-3 px-5 text-gray-500 hidden md:table-cell">{g.location}</td>
                  <td className="py-3 px-5 text-gray-400">{g.event_count}</td>
                  <td className="py-3 px-5 hidden sm:table-cell">
                    {g.stripe_onboarding_complete
                      ? <span className="text-green-400 text-xs">✓ Connected</span>
                      : <span className="text-gray-600 text-xs">Not set up</span>}
                  </td>
                  <td className="py-3 px-5 text-gray-600 text-xs hidden md:table-cell">
                    {formatDate(g.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Events */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between gap-4">
          <h2 className="font-display text-base font-bold uppercase tracking-wide shrink-0">
            Events ({filteredEvents.length})
          </h2>
          <input
            className="input-field text-sm max-w-xs"
            placeholder="Search events or gyms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {filteredEvents.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No events found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left py-3 px-5 text-xs text-gray-400 uppercase tracking-wider">Event</th>
                <th className="text-left py-3 px-5 text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">Gym</th>
                <th className="text-left py-3 px-5 text-xs text-gray-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left py-3 px-5 text-xs text-gray-400 uppercase tracking-wider">Athletes</th>
                <th className="text-left py-3 px-5 text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">Regs</th>
                <th className="text-left py-3 px-5 text-xs text-gray-400 uppercase tracking-wider hidden md:table-cell">Price</th>
                <th className="py-3 px-5" />
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map(e => (
                <tr key={e.id} className="border-b border-surface-border/50 hover:bg-surface-raised/30">
                  <td className="py-3 px-5 font-medium text-white">{e.event_name}</td>
                  <td className="py-3 px-5 text-gray-400 hidden sm:table-cell">{e.gym_name}</td>
                  <td className="py-3 px-5 text-gray-500 hidden md:table-cell">{formatDate(e.event_date)}</td>
                  <td className="py-3 px-5 text-gray-400">{e.racer_count ?? 0}</td>
                  <td className="py-3 px-5 text-gray-400 hidden sm:table-cell">{e.registration_count ?? 0}</td>
                  <td className="py-3 px-5 text-gray-500 hidden md:table-cell">{formatPrice(e.price)}</td>
                  <td className="py-3 px-5 text-right">
                    <Link
                      to={`/events/${e.id}/manage`}
                      className="text-xs text-brand hover:underline"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
