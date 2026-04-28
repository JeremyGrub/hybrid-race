import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import Spinner from '../components/ui/Spinner';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatAmount(cents) {
  if (!cents || cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}

function athleteDisplay(athletes, teamName, category) {
  const DOUBLES = ['Doubles Men', 'Doubles Women', 'Doubles Mixed'];
  if (teamName && !DOUBLES.includes(category)) return teamName;
  if (!athletes || !athletes.length) return null;
  return athletes
    .map(a => [a.first_name, a.last_name].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(' & ');
}

export default function RegisterSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const regId = params.get('reg');
  const isFree = params.get('free') === 'true';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = sessionId ? { session_id: sessionId } : regId ? { reg: regId } : null;
    if (!query) { setLoading(false); return; }

    api.getConfirmation(query)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId, regId]);

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;

  const { event, registration } = data || {};
  const names = registration ? athleteDisplay(registration.athletes, registration.team_name, registration.category) : null;
  const amount = registration ? formatAmount(registration.amount_paid) : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="card p-8 sm:p-10">

        {/* Icon + heading */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand/15 border border-brand/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide mb-2">
            {isFree ? "You're Registered!" : "Payment Complete!"}
          </h1>
          <p className="text-gray-400 text-sm">
            {isFree
              ? 'Your free registration is confirmed.'
              : 'Your payment was successful and your registration is confirmed.'}
          </p>
        </div>

        {/* Registration details */}
        {event && registration && (
          <div className="bg-surface-raised border border-surface-border rounded-xl p-5 mb-6 space-y-3">
            <h2 className="font-display font-bold text-sm uppercase tracking-widest text-gray-400 mb-3">Registration Details</h2>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Event</span>
              <span className="text-white font-medium text-right max-w-[60%]">{event.event_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="text-white font-medium text-right">{formatDate(event.event_date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Location</span>
              <span className="text-white font-medium text-right">{event.location}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Category</span>
              <span className="text-white font-medium">{registration.category}</span>
            </div>
            {names && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Athlete(s)</span>
                <span className="text-white font-medium text-right max-w-[60%]">{names}</span>
              </div>
            )}
            {registration.division && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Division</span>
                <span className="text-white font-medium">{registration.division}</span>
              </div>
            )}
            {registration.age_group && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Age Group</span>
                <span className="text-white font-medium">{registration.age_group}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 border-t border-surface-border">
              <span className="text-gray-500">Amount Paid</span>
              <span className={`font-bold ${amount === 'Free' ? 'text-green-400' : 'text-brand'}`}>{amount}</span>
            </div>
          </div>
        )}

        {/* What's next */}
        <div className="bg-brand/5 border border-brand/15 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">What&apos;s Next</p>
          <ul className="text-sm text-gray-400 space-y-1.5">
            <li>✉️ A confirmation email has been sent to {registration?.lead_email || 'you'}</li>
            <li>📋 Check the event page for schedule updates</li>
            <li>🏁 Arrive early on race day to collect your bib</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {event && (
            <Link to={`/events/${event.id}`} className="btn-primary w-full py-3 text-center">
              View Event Page
            </Link>
          )}
          <Link to="/events" className="btn-secondary w-full py-3 text-center">
            Browse More Events
          </Link>
        </div>

      </div>
    </div>
  );
}
