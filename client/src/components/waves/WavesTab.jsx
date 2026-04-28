import { useState, useEffect } from 'react';
import { api } from '../../api/client';

function displayName(racer) {
  if (racer.team_name) return racer.team_name;
  return [racer.first_name, racer.last_name].filter(Boolean).join(' ') || '—';
}

export default function WavesTab({ eventId, racers }) {
  const [waves, setWaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingWave, setAddingWave] = useState(false);
  const [newWaveName, setNewWaveName] = useState('');
  const [newWaveTime, setNewWaveTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadWaves(); }, [eventId]);

  async function loadWaves() {
    try {
      const data = await api.getWaves(eventId);
      setWaves(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddWave(e) {
    e.preventDefault();
    if (!newWaveName.trim()) return;
    setSaving(true);
    try {
      const wave = await api.createWave(eventId, {
        name: newWaveName.trim(),
        scheduled_time: newWaveTime || null,
      });
      setWaves(w => [...w, wave]);
      setNewWaveName('');
      setNewWaveTime('');
      setAddingWave(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWave(waveId) {
    try {
      await api.deleteWave(waveId);
      setWaves(w => w.filter(x => x.id !== waveId));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAddRacer(waveId, racerId) {
    try {
      const updated = await api.addRacerToWave(waveId, racerId);
      setWaves(w => w.map(x => x.id === waveId ? updated : x));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleRemoveRacer(waveId, racerId) {
    try {
      const updated = await api.removeRacerFromWave(waveId, racerId);
      setWaves(w => w.map(x => x.id === waveId ? updated : x));
    } catch (e) {
      setError(e.message);
    }
  }

  // Racers not yet assigned to a given wave
  function unassignedFor(wave) {
    const assigned = new Set(wave.racers.map(r => r.id));
    return racers.filter(r => !assigned.has(r.id));
  }

  const totalAssigned = new Set(waves.flatMap(w => w.racers.map(r => r.id))).size;
  const unassigned = racers.filter(r => !waves.some(w => w.racers.some(wr => wr.id === r.id)));

  if (loading) return <div className="py-12 text-center text-gray-500">Loading waves...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">
            {waves.length} wave{waves.length !== 1 ? 's' : ''} · {totalAssigned} of {racers.length} athletes assigned
          </p>
        </div>
        <button onClick={() => setAddingWave(true)} className="btn-primary text-sm">
          + Add Wave
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>
      )}

      {/* Add wave form */}
      {addingWave && (
        <form onSubmit={handleAddWave} className="card p-4 border-brand/30 border space-y-3">
          <h3 className="text-sm font-semibold text-white">New Wave</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Wave Name</label>
              <input
                className="input-field"
                placeholder="Wave 1"
                value={newWaveName}
                onChange={e => setNewWaveName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Scheduled Time <span className="text-gray-600 font-normal">(optional)</span></label>
              <input
                type="time"
                className="input-field"
                value={newWaveTime}
                onChange={e => setNewWaveTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !newWaveName.trim()} className="btn-primary text-sm">
              {saving ? 'Creating...' : 'Create Wave'}
            </button>
            <button type="button" onClick={() => { setAddingWave(false); setNewWaveName(''); setNewWaveTime(''); }} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Wave list */}
      {waves.length === 0 && !addingWave && (
        <div className="card p-10 text-center text-gray-500">
          <p className="mb-2">No waves yet.</p>
          <p className="text-xs text-gray-600">Create waves to group athletes by start time on race day.</p>
        </div>
      )}

      {waves.map(wave => (
        <div key={wave.id} className="card p-5 space-y-4">
          {/* Wave header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-white text-base uppercase tracking-wide">{wave.name}</h3>
              {wave.scheduled_time && (
                <p className="text-xs text-gray-500 mt-0.5">🕐 {wave.scheduled_time}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{wave.racers.length} athlete{wave.racers.length !== 1 ? 's' : ''}</span>
              <button
                onClick={() => handleDeleteWave(wave.id)}
                className="text-gray-600 hover:text-red-400 transition-colors text-xs"
                title="Delete wave"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Assigned athletes */}
          {wave.racers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {wave.racers.map(r => (
                <div key={r.id} className="flex items-center gap-1.5 bg-surface-raised border border-surface-border rounded-lg px-3 py-1.5">
                  <span className="text-sm text-white">{displayName(r)}</span>
                  <span className="text-xs text-gray-500">{r.category}</span>
                  <button
                    onClick={() => handleRemoveRacer(wave.id, r.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors ml-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add athlete */}
          {unassignedFor(wave).length > 0 && (
            <div className="flex items-center gap-2">
              <select
                className="input-field text-sm flex-1"
                defaultValue=""
                onChange={e => {
                  if (e.target.value) {
                    handleAddRacer(wave.id, Number(e.target.value));
                    e.target.value = '';
                  }
                }}
              >
                <option value="">+ Add athlete to this wave...</option>
                {unassignedFor(wave).map(r => (
                  <option key={r.id} value={r.id}>
                    {displayName(r)} — {r.category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {wave.racers.length === 0 && unassignedFor(wave).length === 0 && (
            <p className="text-xs text-gray-600">All athletes have been assigned to waves.</p>
          )}
        </div>
      ))}

      {/* Unassigned athletes reminder */}
      {unassigned.length > 0 && waves.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-yellow-400 text-xs font-medium mb-1">
            {unassigned.length} athlete{unassigned.length !== 1 ? 's' : ''} not assigned to any wave:
          </p>
          <p className="text-gray-400 text-xs">{unassigned.map(r => displayName(r)).join(', ')}</p>
        </div>
      )}
    </div>
  );
}
