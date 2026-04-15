import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import Leaderboard from '../components/results/Leaderboard';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { CategoryBadge, AgeGroupBadge } from '../components/ui/Badge';

const CATEGORIES = ['Solo Men', 'Solo Women', 'Doubles Men', 'Doubles Women', 'Doubles Mixed', 'Relay'];
const AGE_GROUPS = ['Open', 'Pro', '40-49', '50-59', '60-69', '70+'];
const TEAM_CATEGORIES = ['Doubles Men', 'Doubles Women', 'Doubles Mixed', 'Relay'];

function isTeamCategory(cat) { return TEAM_CATEGORIES.includes(cat); }

function displayName(racer) {
  if (racer.team_name) return racer.team_name;
  return [racer.first_name, racer.last_name].filter(Boolean).join(' ') || '—';
}

function TimeInput({ value, onChange, onSave, dnf, dns, onDnf, onDns, saving }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="MM:SS"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={dnf || dns}
        className="input-field w-28 font-mono text-center"
      />
      <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={!!dnf}
          onChange={e => { onDnf(e.target.checked); if (e.target.checked) onDns(false); }}
          className="accent-red-500"
        />
        DNF
      </label>
      <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={!!dns}
          onChange={e => { onDns(e.target.checked); if (e.target.checked) onDnf(false); }}
          className="accent-gray-500"
        />
        DNS
      </label>
      <button
        onClick={onSave}
        disabled={saving}
        className="btn-primary py-1.5 text-xs"
      >
        {saving ? '...' : 'Save'}
      </button>
    </div>
  );
}

export default function ManageEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pin, setPin] = useState(() => sessionStorage.getItem(`event-pin-${id}`) || '');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinVerified, setPinVerified] = useState(!!sessionStorage.getItem(`event-pin-${id}`));
  const [verifying, setVerifying] = useState(false);

  const [event, setEvent] = useState(null);
  const [racers, setRacers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('racers');

  // Add racer modal
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ first_name: '', last_name: '', team_name: '', category: 'Solo Men', age_group: 'Open', bib_number: '' });
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Time entry state: { [racerId]: { time, dnf, dns, saving } }
  const [timeState, setTimeState] = useState({});

  const loadData = useCallback(async () => {
    try {
      const [ev, rc] = await Promise.all([api.getEvent(id), api.getRacers(id)]);
      setEvent(ev);
      setRacers(rc);
      // Initialize time state from existing results
      const ts = {};
      rc.forEach(r => {
        ts[r.id] = {
          time: r.finish_time || '',
          dnf: !!r.dnf,
          dns: !!r.dns,
          saving: false,
        };
      });
      setTimeState(ts);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (pinVerified) loadData();
  }, [pinVerified, loadData]);

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
    const isTeam = isTeamCategory(addForm.category);
    if (isTeam && !addForm.team_name.trim()) { setAddError('Team name required'); return; }
    if (!isTeam && !addForm.first_name.trim() && !addForm.last_name.trim()) { setAddError('Name required'); return; }

    setAdding(true);
    try {
      await api.addRacer(id, {
        first_name: addForm.first_name.trim() || null,
        last_name: addForm.last_name.trim() || null,
        team_name: addForm.team_name.trim() || null,
        category: addForm.category,
        age_group: addForm.age_group,
        bib_number: addForm.bib_number.trim() || null,
      }, pin);
      setAddModal(false);
      setAddForm({ first_name: '', last_name: '', team_name: '', category: 'Solo Men', age_group: 'Open', bib_number: '' });
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
    } catch (e) {
      alert(e.message);
    } finally {
      updateTime(racer.id, 'saving', false);
    }
  }

  // PIN gate
  if (!pinVerified) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide mb-2">Manage Event</h1>
          <p className="text-gray-400 text-sm mb-6">Enter your event PIN to continue.</p>
          <form onSubmit={verifyPin} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              className="input-field text-center tracking-widest text-xl"
              placeholder="••••"
              value={pinInput}
              onChange={e => { setPinInput(e.target.value); setPinError(''); }}
              autoFocus
            />
            {pinError && <p className="text-red-400 text-xs">{pinError}</p>}
            <button type="submit" disabled={verifying || !pinInput} className="btn-primary w-full">
              {verifying ? 'Verifying...' : 'Access Event'}
            </button>
            <Link to="/events" className="btn-ghost w-full text-center block">Back to Events</Link>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!event) return <div className="text-center py-32 text-gray-400">Event not found.</div>;

  const isTeam = isTeamCategory(event.event_type);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/events/${id}`} className="text-gray-500 hover:text-gray-300 text-xs">
              ← Back to event
            </Link>
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide">{event.event_name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{event.gym_name} · {event.location}</p>
        </div>
        <button onClick={() => setAddModal(true)} className="btn-primary shrink-0">
          + Add Racer
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface rounded-xl p-1 border border-surface-border w-fit">
        {['racers', 'times', 'results'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-brand text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'times' ? 'Enter Times' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Racers tab */}
      {activeTab === 'racers' && (
        <div className="card overflow-hidden">
          {racers.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="mb-3">No racers yet.</p>
              <button onClick={() => setAddModal(true)} className="btn-primary">Add First Racer</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider">Name / Team</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">Age Group</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 uppercase tracking-wider hidden md:table-cell">Bib</th>
                  <th className="py-3 px-4 w-12" />
                </tr>
              </thead>
              <tbody>
                {racers.map(r => (
                  <tr key={r.id} className="border-b border-surface-border/50 hover:bg-surface-raised/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium">{displayName(r)}</td>
                    <td className="py-3.5 px-4 hidden sm:table-cell"><CategoryBadge category={r.category} /></td>
                    <td className="py-3.5 px-4 hidden sm:table-cell"><AgeGroupBadge group={r.age_group} /></td>
                    <td className="py-3.5 px-4 hidden md:table-cell text-gray-500">{r.bib_number || '—'}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Time entry tab */}
      {activeTab === 'times' && (
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
                          dnf={ts.dnf}
                          dns={ts.dns}
                          onDnf={v => updateTime(r.id, 'dnf', v)}
                          onDns={v => updateTime(r.id, 'dns', v)}
                          saving={ts.saving}
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

      {/* Results preview tab */}
      {activeTab === 'results' && (
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-5">Live Results</h2>
          <Leaderboard results={racers} showCategory />
        </div>
      )}

      {/* Add racer modal */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setAddError(''); }} title="Add Racer">
        <form onSubmit={handleAddRacer} className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select
              className="input-field"
              value={addForm.category}
              onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {isTeamCategory(addForm.category) ? (
            <div>
              <label className="label">Team Name</label>
              <input
                className="input-field"
                placeholder="Team name"
                value={addForm.team_name}
                onChange={e => setAddForm(f => ({ ...f, team_name: e.target.value }))}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <input
                  className="input-field"
                  placeholder="First"
                  value={addForm.first_name}
                  onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  className="input-field"
                  placeholder="Last"
                  value={addForm.last_name}
                  onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Age Group</label>
              <select
                className="input-field"
                value={addForm.age_group}
                onChange={e => setAddForm(f => ({ ...f, age_group: e.target.value }))}
              >
                {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Bib # (optional)</label>
              <input
                className="input-field"
                placeholder="42"
                value={addForm.bib_number}
                onChange={e => setAddForm(f => ({ ...f, bib_number: e.target.value }))}
              />
            </div>
          </div>

          {addError && <p className="text-red-400 text-xs">{addError}</p>}
          <button type="submit" disabled={adding} className="btn-primary w-full">
            {adding ? 'Adding...' : 'Add Racer'}
          </button>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Racer">
        <p className="text-gray-400 text-sm mb-5">Are you sure you want to remove this racer? This also deletes their result.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1">
            {deleting ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
