import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, getToken, getStoredGym } from '../api/client';
import Leaderboard from '../components/results/Leaderboard';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { CategoryBadge, AgeGroupBadge, DivisionBadge } from '../components/ui/Badge';
import WavesTab from '../components/waves/WavesTab';
import RaceDayTab from '../components/waves/RaceDayTab';

const CATEGORIES = ['Solo Men', 'Solo Women', 'Doubles Men', 'Doubles Women', 'Doubles Mixed', 'Relay'];
const AGE_GROUPS = ['U30', '30-39', '40-49', '50-59', '60-69', '70+'];
const DIVISIONS = ['Open', 'Pro'];
const DOUBLES_CATEGORIES = ['Doubles Men', 'Doubles Women', 'Doubles Mixed'];
const TEAM_CATEGORIES = [...DOUBLES_CATEGORIES, 'Relay'];

function isTeamCategory(cat) { return TEAM_CATEGORIES.includes(cat); }
function isDoubles(cat) { return DOUBLES_CATEGORIES.includes(cat); }
function isRelay(cat) { return cat === 'Relay'; }

function displayName(racer) {
  if (racer.team_name) return racer.team_name;
  return [racer.first_name, racer.last_name].filter(Boolean).join(' ') || '—';
}

function formatTimeInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4)}`;
}

function StatusBadge({ status }) {
  const colors = {
    paid: 'bg-green-500/15 text-green-400 border-green-500/30',
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

function TimeInput({ value, onChange, onSave, onEdit, dnf, dns, onDnf, onDns, saving, saved, locked }) {
  const inputRef = useRef(null);
  useEffect(() => { if (!locked && inputRef.current) inputRef.current.focus(); }, [locked]);

  function handleChange(e) { onChange(formatTimeInput(e.target.value)); }

  function handleKeyDown(e) {
    const input = e.target;
    if (e.key === 'Backspace' && input.selectionStart === input.selectionEnd) {
      const pos = input.selectionStart;
      if (pos > 0 && value[pos - 1] === ':') {
        e.preventDefault();
        const digits = value.replace(/\D/g, '').slice(0, -1);
        onChange(formatTimeInput(digits));
      }
    }
    if (e.key === 'Enter') onSave();
    if (e.key === 'Escape') onEdit(false);
  }

  if (locked) {
    const display = dnf ? 'DNF' : dns ? 'DNS' : value || '—';
    const displayColor = dnf ? 'text-red-400' : dns ? 'text-gray-500' : value ? 'text-white' : 'text-gray-600';
    return (
      <div className="flex items-center gap-3">
        <span className={`font-display text-lg font-semibold w-24 ${displayColor}`}>{display}</span>
        <button onClick={() => onEdit(true)} className="text-xs text-gray-500 hover:text-brand transition-colors flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        placeholder="HH:MM:SS"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onSave}
        disabled={dnf || dns}
        className="input-field w-32 font-mono text-center"
      />
      <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer select-none">
        <input type="checkbox" checked={!!dnf} onChange={e => { onDnf(e.target.checked); if (e.target.checked) onDns(false); }} className="accent-red-500" />
        DNF
      </label>
      <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer select-none">
        <input type="checkbox" checked={!!dns} onChange={e => { onDns(e.target.checked); if (e.target.checked) onDnf(false); }} className="accent-gray-500" />
        DNS
      </label>
      <button
        onClick={onSave}
        disabled={saving}
        className={`py-1.5 text-xs font-semibold px-3 rounded-lg border transition-all duration-200 ${saved ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'btn-primary'}`}
      >
        {saving ? '...' : saved ? '✓ Saved' : 'Save'}
      </button>
    </div>
  );
}

export default function ManageEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const gym = getStoredGym();

  // PIN state (still needed for Enter Times tab — race-day volunteers)
  const [pin, setPin] = useState(() => sessionStorage.getItem(`event-pin-${id}`) || '');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinVerified, setPinVerified] = useState(!!sessionStorage.getItem(`event-pin-${id}`));
  const [verifying, setVerifying] = useState(false);

  const [event, setEvent] = useState(null);
  const [racers, setRacers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registrations');

  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ first_name: '', last_name: '', partner_first: '', partner_last: '', team_name: '', category: 'Solo Men', division: '', age_group: '', bib_number: '' });
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [editing, setEditing] = useState(false);

  const [deleteEventModal, setDeleteEventModal] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);

  const [resetPinModal, setResetPinModal] = useState(false);
  const [resetPinLoading, setResetPinLoading] = useState(false);
  const [newPin, setNewPin] = useState('');

  const [timeState, setTimeState] = useState({});

  // Auth check
  useEffect(() => {
    if (!getToken()) navigate('/login', { replace: true });
  }, [navigate]);

  const loadData = useCallback(async () => {
    try {
      const [ev, rc] = await Promise.all([api.getEvent(id), api.getRacers(id)]);
      setEvent(ev);
      setRacers(rc);
      const ts = {};
      rc.forEach(r => {
        ts[r.id] = {
          time: r.finish_time || '',
          dnf: !!r.dnf,
          dns: !!r.dns,
          saving: false,
          saved: false,
          locked: !!(r.finish_time || r.dnf || r.dns),
        };
      });
      setTimeState(ts);

      // Load registrations if gym owns this event
      if (getToken()) {
        try {
          const regs = await api.getRegistrations(id);
          setRegistrations(regs);
        } catch { /* not owner or no regs */ }
      }
    } catch (err) {
      if (err.message.includes('401')) navigate('/login', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  async function verifyPin(e) {
    e.preventDefault();
    setVerifying(true);
    setPinError('');
    try {
      const { valid } = await api.verifyPin(id, pinInput);
      if (valid) {
        sessionStorage.setItem(`event-pin-${id}`, pinInput);
        setPin(pinInput);
        setPinVerified(true);
      } else {
        setPinError('Incorrect PIN');
      }
    } catch {
      setPinError('Could not verify PIN');
    } finally {
      setVerifying(false);
    }
  }

  async function handleAddRacer(e) {
    e.preventDefault();
    setAddError('');
    const cat = addForm.category;
    if (isRelay(cat) && !addForm.team_name.trim()) { setAddError('Team name required'); return; }
    if (isDoubles(cat) && (!addForm.first_name.trim() || !addForm.partner_first.trim())) { setAddError('Both athlete names required'); return; }
    if (!isTeamCategory(cat) && !addForm.first_name.trim() && !addForm.last_name.trim()) { setAddError('Name required'); return; }

    // For doubles: combine athlete names as the team_name
    let teamName = addForm.team_name.trim() || null;
    let firstName = addForm.first_name.trim() || null;
    let lastName = addForm.last_name.trim() || null;
    if (isDoubles(cat)) {
      const name1 = [addForm.first_name.trim(), addForm.last_name.trim()].filter(Boolean).join(' ');
      const name2 = [addForm.partner_first.trim(), addForm.partner_last.trim()].filter(Boolean).join(' ');
      teamName = [name1, name2].filter(Boolean).join(' & ');
      firstName = null;
      lastName = null;
    }

    setAdding(true);
    try {
      await api.addRacer(id, {
        first_name: firstName,
        last_name: lastName,
        team_name: teamName,
        category: cat,
        division: addForm.division || null,
        age_group: addForm.age_group || null,
        bib_number: addForm.bib_number.trim() || null,
      }, pin);
      setAddModal(false);
      setAddForm({ first_name: '', last_name: '', partner_first: '', partner_last: '', team_name: '', category: 'Solo Men', division: '', age_group: '', bib_number: '' });
      await loadData();
    } catch (e) {
      setAddError(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteRacer(deleteId, pin);
      setDeleteId(null);
      await loadData();
    } catch { }
    finally { setDeleting(false); }
  }

  function parseEventTypes(raw) {
    if (!raw) return [];
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [p]; } catch { return [raw]; }
  }

  function openEditModal() {
    setEditForm({
      event_name: event?.event_name || '',
      location: event?.location || '',
      event_date: event?.event_date || '',
      description: event?.description || '',
      event_types: parseEventTypes(event?.event_type),
    });
    setEditError('');
    setEditModal(true);
  }

  function toggleEditType(t) {
    setEditForm(f => {
      const has = f.event_types.includes(t);
      return { ...f, event_types: has ? f.event_types.filter(x => x !== t) : [...f.event_types, t] };
    });
  }

  async function handleEditEvent(e) {
    e.preventDefault();
    setEditError('');
    if (!editForm.event_types.length) { setEditError('Select at least one event type'); return; }
    setEditing(true);
    try {
      await api.updateEvent(id, {
        event_name: editForm.event_name,
        location: editForm.location,
        event_date: editForm.event_date,
        description: editForm.description || null,
        event_type: JSON.stringify(editForm.event_types),
      });
      setEditModal(false);
      await loadData();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditing(false);
    }
  }

  async function handleDeleteEvent() {
    setDeletingEvent(true);
    try {
      await api.deleteEvent(id);
      navigate('/dashboard');
    } catch {
      setDeletingEvent(false);
    }
  }

  async function handleResetPin() {
    setResetPinLoading(true);
    try {
      const { pin: generatedPin } = await api.resetPin(id);
      setNewPin(generatedPin);
    } catch (e) {
      alert(e.message);
      setResetPinModal(false);
    } finally {
      setResetPinLoading(false);
    }
  }

  function updateTime(racerId, key, val) {
    setTimeState(ts => ({ ...ts, [racerId]: { ...ts[racerId], [key]: val } }));
  }

  async function saveTime(racer) {
    const state = timeState[racer.id] || {};
    updateTime(racer.id, 'saving', true);
    try {
      await api.updateResult(racer.id, {
        finish_time: state.time || null,
        dnf: state.dnf || false,
        dns: state.dns || false,
      }, pin);
      await loadData();
      updateTime(racer.id, 'saved', true);
      updateTime(racer.id, 'locked', true);
      setTimeout(() => updateTime(racer.id, 'saved', false), 1500);
    } catch (e) {
      alert(e.message);
    } finally {
      updateTime(racer.id, 'saving', false);
    }
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!event) return <div className="text-center py-32 text-gray-400">Event not found.</div>;

  // Check ownership
  const isOwner = gym && event.gym_id === gym.id;

  const tabs = [
    { key: 'registrations', label: 'Registrations' },
    { key: 'racers', label: 'Racers' },
    { key: 'waves', label: 'Waves' },
    { key: 'raceday', label: '🏁 Race Day' },
    { key: 'times', label: 'Enter Times' },
    { key: 'results', label: 'Results' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link to={isOwner ? '/dashboard' : `/events/${id}`} className="text-gray-500 hover:text-gray-300 text-xs">
            {isOwner ? '← Dashboard' : '← Back to event'}
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide leading-tight">{event.event_name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{event.gym_name} · {event.location}</p>
          </div>
          {isOwner && (
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0">
              <button
                onClick={() => { setResetPinModal(true); setNewPin(''); }}
                className="btn-secondary text-xs"
                title="Generate a new event PIN"
              >
                🔑 Reset PIN
              </button>
              <button onClick={openEditModal} className="btn-secondary text-sm">Edit Event</button>
              <button onClick={() => setDeleteEventModal(true)} className="btn-danger text-sm">Delete</button>
              <button onClick={() => setAddModal(true)} className="btn-primary text-sm col-span-2 sm:col-span-1">+ Add Racer</button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full overflow-x-auto mb-6">
        <div className="flex gap-1 bg-surface rounded-xl p-1 border border-surface-border w-fit min-w-full sm:min-w-0 sm:w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key ? 'bg-brand text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.key === 'registrations' && registrations.length > 0 && (
              <span className="ml-1.5 bg-brand/20 text-brand text-xs px-1.5 py-0.5 rounded-full">
                {registrations.length}
              </span>
            )}
          </button>
        ))}
        </div>
      </div>

      {/* Registrations tab */}
      {activeTab === 'registrations' && (
        <div className="card overflow-hidden">
          {registrations.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="mb-3">No registrations yet.</p>
              <p className="text-xs text-gray-600">Share the registration link to get athletes signed up.</p>
              <div className="mt-4">
                <Link to={`/events/${id}/register`} className="btn-secondary text-sm">
                  View Registration Page
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider">Athlete(s)</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider hidden md:table-cell">Amount</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(reg => {
                  const athletes = Array.isArray(reg.athletes) ? reg.athletes : [];
                  const nameDisplay = reg.team_name
                    ? reg.team_name
                    : athletes.map(a => `${a.first_name || ''} ${a.last_name || ''}`.trim()).join(', ') || '—';
                  return (
                    <tr key={reg.id} className="border-b border-surface-border/50 hover:bg-surface-raised/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div>{nameDisplay}</div>
                        {reg.team_name && athletes.length > 0 && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {athletes.map(a => `${a.first_name || ''} ${a.last_name || ''}`.trim()).join(' · ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <CategoryBadge category={reg.category} />
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell text-gray-400 text-xs">{reg.lead_email}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={reg.status} /></td>
                      <td className="py-3.5 px-4 hidden md:table-cell text-gray-400 text-xs">
                        {reg.amount_paid != null ? `$${(reg.amount_paid / 100).toFixed(2)}` : reg.status === 'paid' ? 'Free' : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Racers tab */}
      {activeTab === 'racers' && (
        <div className="card overflow-hidden">
          {racers.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="mb-3">No racers yet.</p>
              {isOwner && <button onClick={() => setAddModal(true)} className="btn-primary">Add First Racer</button>}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider">Name / Team</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">Division / Age</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider hidden md:table-cell">Bib</th>
                  {isOwner && <th className="py-3 px-4 w-12" />}
                </tr>
              </thead>
              <tbody>
                {racers.map(r => (
                  <tr key={r.id} className="border-b border-surface-border/50 hover:bg-surface-raised/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium">{displayName(r)}</td>
                    <td className="py-3.5 px-4 hidden sm:table-cell"><CategoryBadge category={r.category} /></td>
                    <td className="py-3.5 px-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <DivisionBadge division={r.division} />
                        <AgeGroupBadge group={r.age_group} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell text-gray-500">{r.bib_number || '—'}</td>
                    {isOwner && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setDeleteId(r.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                          title="Remove racer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Waves tab — setup waves and assign athletes */}
      {activeTab === 'waves' && isOwner && (
        <WavesTab eventId={id} racers={racers} />
      )}

      {/* Race Day tab — live timing with PIN auth */}
      {activeTab === 'raceday' && (
        <>
          {!pinVerified ? (
            <div className="card p-8 max-w-sm mx-auto">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-1">Race Day Timing</h2>
              <p className="text-gray-400 text-sm mb-6">Enter your event PIN to access the timing dashboard.</p>
              <form onSubmit={verifyPin} className="space-y-4">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className="input-field text-center tracking-widest text-xl"
                  placeholder="••••••"
                  value={pinInput}
                  onChange={e => { setPinInput(e.target.value); setPinError(''); }}
                  autoFocus
                />
                {pinError && <p className="text-red-400 text-xs">{pinError}</p>}
                <button type="submit" disabled={verifying || !pinInput} className="btn-primary w-full">
                  {verifying ? 'Verifying...' : 'Access Race Day'}
                </button>
              </form>
            </div>
          ) : (
            <RaceDayTab eventId={id} pin={pin} />
          )}
        </>
      )}

      {/* Enter Times tab — PIN auth for race-day volunteers */}
      {activeTab === 'times' && (
        <>
          {!pinVerified ? (
            <div className="card p-8 max-w-sm mx-auto">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-1">Race-Day Time Entry</h2>
              <p className="text-gray-400 text-sm mb-6">Enter your event PIN to enter finish times.</p>
              <form onSubmit={verifyPin} className="space-y-4">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className="input-field text-center tracking-widest text-xl"
                  placeholder="••••••"
                  value={pinInput}
                  onChange={e => { setPinInput(e.target.value); setPinError(''); }}
                  autoFocus
                />
                {pinError && <p className="text-red-400 text-xs">{pinError}</p>}
                <button type="submit" disabled={verifying || !pinInput} className="btn-primary w-full">
                  {verifying ? 'Verifying...' : 'Access Time Entry'}
                </button>
              </form>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {racers.length === 0 ? (
                <div className="text-center py-16 text-gray-500">Add racers first to enter times.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider">Name / Team</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {racers.map(r => {
                      const ts = timeState[r.id] || { time: '', dnf: false, dns: false, saving: false };
                      return (
                        <tr key={r.id} className="border-b border-surface-border/50">
                          <td className="py-3 px-4 font-medium">{displayName(r)}</td>
                          <td className="py-3 px-4 hidden sm:table-cell"><CategoryBadge category={r.category} /></td>
                          <td className="py-3 px-4">
                            <TimeInput
                              value={ts.time}
                              onChange={v => updateTime(r.id, 'time', v)}
                              onSave={() => saveTime(r)}
                              onEdit={unlock => updateTime(r.id, 'locked', !unlock)}
                              dnf={ts.dnf}
                              dns={ts.dns}
                              onDnf={v => updateTime(r.id, 'dnf', v)}
                              onDns={v => updateTime(r.id, 'dns', v)}
                              saving={ts.saving}
                              saved={ts.saved}
                              locked={ts.locked}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* Results tab */}
      {activeTab === 'results' && (
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-5">Live Results</h2>
          <Leaderboard results={racers} showCategory />
        </div>
      )}

      {/* Modals — only shown to owner */}
      {isOwner && (
        <>
          <Modal open={addModal} onClose={() => { setAddModal(false); setAddError(''); }} title="Add Racer">
            <form onSubmit={handleAddRacer} className="space-y-4">
              <div>
                <label className="label">Category</label>
                <select className="input-field" value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {isDoubles(addForm.category) ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Athlete 1 First</label>
                      <input className="input-field" placeholder="Jane" value={addForm.first_name} onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Athlete 1 Last</label>
                      <input className="input-field" placeholder="Smith" value={addForm.last_name} onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Athlete 2 First</label>
                      <input className="input-field" placeholder="Bob" value={addForm.partner_first} onChange={e => setAddForm(f => ({ ...f, partner_first: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Athlete 2 Last</label>
                      <input className="input-field" placeholder="Jones" value={addForm.partner_last} onChange={e => setAddForm(f => ({ ...f, partner_last: e.target.value }))} />
                    </div>
                  </div>
                </div>
              ) : isRelay(addForm.category) ? (
                <div>
                  <label className="label">Team Name</label>
                  <input className="input-field" placeholder="Team name" value={addForm.team_name} onChange={e => setAddForm(f => ({ ...f, team_name: e.target.value }))} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">First Name</label>
                    <input className="input-field" placeholder="First" value={addForm.first_name} onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input className="input-field" placeholder="Last" value={addForm.last_name} onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))} />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Division (optional)</label>
                  <select className="input-field" value={addForm.division} onChange={e => setAddForm(f => ({ ...f, division: e.target.value }))}>
                    <option value="">— None —</option>
                    {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Age Group (optional)</label>
                  <select className="input-field" value={addForm.age_group} onChange={e => setAddForm(f => ({ ...f, age_group: e.target.value }))}>
                    <option value="">— None —</option>
                    {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Bib # (optional)</label>
                <input className="input-field" placeholder="42" value={addForm.bib_number} onChange={e => setAddForm(f => ({ ...f, bib_number: e.target.value }))} />
              </div>
              {!pinVerified && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-400 text-xs">You need to enter your PIN (in the Enter Times tab) to add/remove racers manually.</p>
                </div>
              )}
              {addError && <p className="text-red-400 text-xs">{addError}</p>}
              <button type="submit" disabled={adding} className="btn-primary w-full">
                {adding ? 'Adding...' : 'Add Racer'}
              </button>
            </form>
          </Modal>

          <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Event">
            <form onSubmit={handleEditEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Event Name</label>
                  <input className="input-field" value={editForm.event_name || ''} onChange={e => setEditForm(f => ({ ...f, event_name: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input className="input-field" value={editForm.location || ''} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Event Date</label>
                  <input type="date" className="input-field" value={editForm.event_date || ''} onChange={e => setEditForm(f => ({ ...f, event_date: e.target.value }))} required />
                </div>
                <div className="col-span-2">
                  <label className="label">Description (optional)</label>
                  <textarea className="input-field resize-none" rows={2} value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Event Types</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(t => (
                    <button key={t} type="button"
                      onClick={() => toggleEditType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        (editForm.event_types || []).includes(t)
                          ? 'bg-brand text-black border-brand'
                          : 'bg-surface-raised text-gray-400 border-surface-border hover:border-brand/40'
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>
              {editError && <p className="text-red-400 text-xs">{editError}</p>}
              <button type="submit" disabled={editing} className="btn-primary w-full">
                {editing ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </Modal>

          <Modal open={deleteEventModal} onClose={() => setDeleteEventModal(false)} title="Delete Event">
            <p className="text-gray-400 text-sm mb-2">
              This will permanently delete <span className="text-white font-medium">{event?.event_name}</span> and all its racers and results.
            </p>
            <p className="text-red-400 text-xs mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteEventModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDeleteEvent} disabled={deletingEvent} className="btn-danger flex-1">
                {deletingEvent ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </Modal>

          <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Racer">
            <p className="text-gray-400 text-sm mb-5">Are you sure you want to remove this racer? This also deletes their result.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1">
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </Modal>

          <Modal
            open={resetPinModal}
            onClose={() => { setResetPinModal(false); setNewPin(''); }}
            title="Reset Event PIN"
          >
            {newPin ? (
              <div className="space-y-5">
                <p className="text-gray-400 text-sm">Your new PIN has been generated. Share it with your volunteers and anyone who needs access to Race Day timing.</p>
                <div className="bg-surface-raised border border-brand/30 rounded-xl p-6 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">New Event PIN</p>
                  <p className="font-display text-5xl font-bold tracking-[0.3em] text-brand">{newPin}</p>
                  <p className="text-xs text-gray-600 mt-3">Save this — it won't be shown again</p>
                </div>
                <button
                  onClick={() => { setResetPinModal(false); setNewPin(''); }}
                  className="btn-primary w-full"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-gray-400 text-sm">
                  This will invalidate your current PIN and generate a new one. Anyone using the old PIN for timing will be locked out.
                </p>
                <p className="text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                  Make sure to share the new PIN with your race day volunteers before starting.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setResetPinModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleResetPin} disabled={resetPinLoading} className="btn-primary flex-1">
                    {resetPinLoading ? 'Generating...' : 'Generate New PIN'}
                  </button>
                </div>
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
