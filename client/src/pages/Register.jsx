import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Spinner from '../components/ui/Spinner';

const DIVISIONS = ['Open', 'Pro'];
const AGE_GROUPS = ['U30', '30-39', '40-49', '50-59', '60-69', '70+'];
const DOUBLES_CATEGORIES = ['Doubles Men', 'Doubles Women', 'Doubles Mixed'];
const TEAM_CATEGORIES = [...DOUBLES_CATEGORIES, 'Relay'];
const ATHLETE_COUNT = { 'Doubles Men': 2, 'Doubles Women': 2, 'Doubles Mixed': 2, 'Relay': 4 };

function isTeam(cat) { return TEAM_CATEGORIES.includes(cat); }
function isDoubles(cat) { return DOUBLES_CATEGORIES.includes(cat); }
function isRelay(cat) { return cat === 'Relay'; }

function parseTypes(event_type) {
  if (!event_type) return [];
  try { const p = JSON.parse(event_type); return Array.isArray(p) ? p : [p]; }
  catch { return [event_type]; }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatPrice(cents) {
  if (!cents || cents === 0) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

function emptyAthlete() { return { first_name: '', last_name: '', email: '' }; }

export default function Register() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const [category, setCategory] = useState('');
  const [division, setDivision] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [teamName, setTeamName] = useState('');
  const [athletes, setAthletes] = useState([emptyAthlete()]);
  const [leadEmail, setLeadEmail] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [waiverAgreed, setWaiverAgreed] = useState(false);
  const [waiverName, setWaiverName] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.getEvent(id)
      .then(ev => {
        setEvent(ev);
        const types = parseTypes(ev.event_type);
        if (types.length === 1) {
          setCategory(types[0]);
          initAthletes(types[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  function initAthletes(cat) {
    if (isTeam(cat)) {
      const count = ATHLETE_COUNT[cat] || 2;
      setAthletes(Array.from({ length: count }, emptyAthlete));
    } else {
      setAthletes([emptyAthlete()]);
    }
  }

  function handleCategorySelect(cat) {
    setCategory(cat);
    initAthletes(cat);
    setErrors(e => ({ ...e, category: null }));
  }

  function setAthlete(idx, field, val) {
    setAthletes(prev => prev.map((a, i) => i === idx ? { ...a, [field]: val } : a));
    setErrors(e => ({ ...e, [`athlete_${idx}_${field}`]: null }));
  }

  function validate() {
    const errs = {};
    if (!category) { errs.category = 'Select a category'; }
    if (isRelay(category) && !teamName.trim()) { errs.team_name = 'Team name is required'; }
    athletes.forEach((a, i) => {
      if (!a.first_name.trim()) errs[`athlete_${i}_first_name`] = 'Required';
      if (!a.last_name.trim()) errs[`athlete_${i}_last_name`] = 'Required';
      if (i === 0 || !isTeam(category)) {
        if (!a.email.trim()) errs[`athlete_${i}_email`] = 'Required';
        else if (!/\S+@\S+\.\S+/.test(a.email)) errs[`athlete_${i}_email`] = 'Invalid email';
      }
    });
    if (isTeam(category) && !leadEmail.trim()) { errs.lead_email = 'Contact email is required'; }
    else if (isTeam(category) && leadEmail && !/\S+@\S+\.\S+/.test(leadEmail)) { errs.lead_email = 'Invalid email'; }
    if (!termsAgreed) errs.terms = 'You must agree to the Terms of Service';
    if (event?.waiver_path && !waiverAgreed) errs.waiver = 'You must agree to the event waiver';
    if (event?.waiver_path && !waiverName.trim()) errs.waiver_name = 'Type your full name to sign the waiver';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError('');
    try {
      const effectiveLeadEmail = isTeam(category) ? leadEmail : athletes[0].email;

      const body = {
        category,
        division: division || undefined,
        age_group: ageGroup || undefined,
        team_name: teamName || undefined,
        athletes,
        lead_email: effectiveLeadEmail,
        terms_agreed: true,
        waiver_agreed: waiverAgreed,
        waiver_name: waiverName || undefined,
      };

      const result = await api.checkout(id, body);

      if (result.free) {
        navigate('/register/success?free=true');
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch(err) {
      setApiError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!event) return <div className="text-center py-32 text-gray-400">Event not found.</div>;

  const types = parseTypes(event.event_type);
  const priceDisplay = formatPrice(event.price);
  const teamMode = isTeam(category);
  const athleteCount = teamMode ? (ATHLETE_COUNT[category] || 2) : 1;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Event header */}
      <div className="mb-8">
        <Link to={`/events/${id}`} className="text-gray-500 hover:text-gray-300 text-xs mb-3 inline-block">
          ← Back to event
        </Link>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide mb-1">{event.event_name}</h1>
        <p className="text-gray-400 text-sm">{event.gym_name} · {event.location} · {formatDate(event.event_date)}</p>
        {priceDisplay && (
          <p className="text-brand font-semibold text-lg mt-2">{priceDisplay} per registration</p>
        )}
        {!priceDisplay && (
          <p className="text-green-400 font-semibold text-sm mt-2">Free registration</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category selection */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-base font-bold uppercase tracking-widest text-gray-400">Category</h2>
          <div className="flex flex-wrap gap-2">
            {types.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleCategorySelect(t)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  category === t
                    ? 'bg-brand text-black border-brand'
                    : 'bg-surface-raised text-gray-400 border-surface-border hover:text-white hover:border-gray-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {errors.category && <p className="text-red-400 text-xs">{errors.category}</p>}
        </div>

        {/* Division & Age Group */}
        {category && !!(event.use_divisions || event.use_age_groups) && (
          <div className="card p-6 space-y-4">
            <h2 className="font-display text-base font-bold uppercase tracking-widest text-gray-400">Division &amp; Age Group</h2>

            {event.use_divisions && (
              <div>
                <label className="label">Division (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {DIVISIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDivision(prev => prev === d ? '' : d)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        division === d
                          ? 'bg-brand text-black border-brand'
                          : 'bg-surface-raised text-gray-400 border-surface-border hover:text-white hover:border-gray-500'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {event.use_age_groups && (
              <div>
                <label className="label">Age Group (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {AGE_GROUPS.map(ag => (
                    <button
                      key={ag}
                      type="button"
                      onClick={() => setAgeGroup(prev => prev === ag ? '' : ag)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        ageGroup === ag
                          ? 'bg-brand text-black border-brand'
                          : 'bg-surface-raised text-gray-400 border-surface-border hover:text-white hover:border-gray-500'
                      }`}
                    >
                      {ag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Athlete info */}
        {category && (
          <div className="card p-6 space-y-5">
            <h2 className="font-display text-base font-bold uppercase tracking-widest text-gray-400">
              {teamMode ? 'Team Info' : 'Athlete Info'}
            </h2>

            {isRelay(category) && (
              <div>
                <label className="label">Team Name</label>
                <input
                  className="input-field"
                  placeholder="Team Thunderbolt"
                  value={teamName}
                  onChange={e => { setTeamName(e.target.value); setErrors(er => ({ ...er, team_name: null })); }}
                />
                {errors.team_name && <p className="text-red-400 text-xs mt-1">{errors.team_name}</p>}
              </div>
            )}

            {Array.from({ length: athleteCount }, (_, i) => (
              <div key={i} className={`space-y-3 ${i > 0 ? 'pt-4 border-t border-surface-border' : ''}`}>
                {teamMode && (
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Athlete {i + 1}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      className="input-field"
                      placeholder="Jane"
                      value={athletes[i]?.first_name || ''}
                      onChange={e => setAthlete(i, 'first_name', e.target.value)}
                    />
                    {errors[`athlete_${i}_first_name`] && <p className="text-red-400 text-xs mt-1">{errors[`athlete_${i}_first_name`]}</p>}
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      className="input-field"
                      placeholder="Smith"
                      value={athletes[i]?.last_name || ''}
                      onChange={e => setAthlete(i, 'last_name', e.target.value)}
                    />
                    {errors[`athlete_${i}_last_name`] && <p className="text-red-400 text-xs mt-1">{errors[`athlete_${i}_last_name`]}</p>}
                  </div>
                </div>
                {(!teamMode || i === 0) && (
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="jane@example.com"
                      value={athletes[i]?.email || ''}
                      onChange={e => setAthlete(i, 'email', e.target.value)}
                    />
                    {errors[`athlete_${i}_email`] && <p className="text-red-400 text-xs mt-1">{errors[`athlete_${i}_email`]}</p>}
                  </div>
                )}
              </div>
            ))}

            {teamMode && (
              <div>
                <label className="label">Team Contact Email</label>
                <p className="text-xs text-gray-500 mb-1.5">Confirmation will be sent here</p>
                <input
                  type="email"
                  className="input-field"
                  placeholder="contact@example.com"
                  value={leadEmail}
                  onChange={e => { setLeadEmail(e.target.value); setErrors(er => ({ ...er, lead_email: null })); }}
                />
                {errors.lead_email && <p className="text-red-400 text-xs mt-1">{errors.lead_email}</p>}
              </div>
            )}
          </div>
        )}

        {/* Legal */}
        {category && (
          <div className="card p-6 space-y-4">
            <h2 className="font-display text-base font-bold uppercase tracking-widest text-gray-400">Agreement</h2>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 accent-brand"
                checked={termsAgreed}
                onChange={e => { setTermsAgreed(e.target.checked); setErrors(er => ({ ...er, terms: null })); }}
              />
              <span className="text-sm text-gray-300">
                I agree to the RaceGrid{' '}
                <Link to="/terms" target="_blank" className="text-brand hover:text-brand-dim">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" className="text-brand hover:text-brand-dim">Privacy Policy</Link>
              </span>
            </label>
            {errors.terms && <p className="text-red-400 text-xs">{errors.terms}</p>}

            {event.waiver_path && (
              <div className="space-y-3 pt-1 border-t border-surface-border">
                <div>
                  <p className="text-sm font-medium text-white mb-1">Event Waiver</p>
                  <p className="text-xs text-gray-500">
                    Please read the{' '}
                    <a
                      href={`/api/events/${id}/waiver`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:text-brand-dim underline"
                    >
                      event waiver
                    </a>
                    {' '}before signing below.
                  </p>
                </div>

                <div>
                  <label className="label">Full Legal Name <span className="text-gray-500 font-normal">(electronic signature)</span></label>
                  <input
                    className="input-field"
                    placeholder="Jane Smith"
                    value={waiverName}
                    onChange={e => { setWaiverName(e.target.value); setErrors(er => ({ ...er, waiver_name: null })); }}
                  />
                  {errors.waiver_name && <p className="text-red-400 text-xs mt-1">{errors.waiver_name}</p>}
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-brand"
                    checked={waiverAgreed}
                    onChange={e => { setWaiverAgreed(e.target.checked); setErrors(er => ({ ...er, waiver: null })); }}
                  />
                  <span className="text-sm text-gray-300">
                    I have read and agree to the event waiver
                  </span>
                </label>
                {errors.waiver && <p className="text-red-400 text-xs">{errors.waiver}</p>}
              </div>
            )}
          </div>
        )}

        {apiError && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{apiError}</p>
        )}

        {category && (
          <button type="submit" disabled={submitting || !category} className="btn-primary w-full py-3 text-base">
            {submitting
              ? 'Processing...'
              : priceDisplay
                ? `Register & Pay ${priceDisplay}`
                : 'Register Free'}
          </button>
        )}
      </form>
    </div>
  );
}
