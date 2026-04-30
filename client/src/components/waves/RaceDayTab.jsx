import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../api/client';

function displayName(racer) {
  if (racer.team_name) return racer.team_name;
  return [racer.first_name, racer.last_name].filter(Boolean).join(' ') || '—';
}

function formatElapsed(ms) {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const base = h > 0
    ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${base}.${tenths}`;
}

function WaveTimer({ startedAt }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => setElapsed(Date.now() - start), 100);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;
  return (
    <span className="font-display text-3xl font-bold text-brand tabular-nums">
      {formatElapsed(elapsed)}
    </span>
  );
}

export default function RaceDayTab({ eventId, pin }) {
  const [waves, setWaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [finishing, setFinishing] = useState({}); // racerId -> true while saving
  const [starting, setStarting] = useState({}); // waveId -> true while starting
  const wavesRef = useRef(waves);
  wavesRef.current = waves;

  const loadWaves = useCallback(async () => {
    try {
      const data = await api.getWavesRaceDay(eventId, pin);
      setWaves(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, pin]);

  useEffect(() => {
    loadWaves();
    // Refresh wave data every 5s to pick up changes from other devices
    const interval = setInterval(loadWaves, 5000);
    return () => clearInterval(interval);
  }, [loadWaves]);

  async function handleStartWave(waveId) {
    setStarting(s => ({ ...s, [waveId]: true }));
    try {
      const { started_at } = await api.startWave(waveId, pin);
      setWaves(ws => ws.map(w => w.id === waveId ? { ...w, started_at } : w));
    } catch (e) {
      setError(e.message);
    } finally {
      setStarting(s => ({ ...s, [waveId]: false }));
    }
  }

  async function handleFinish(waveId, racerId) {
    setFinishing(f => ({ ...f, [racerId]: true }));
    try {
      const { finish_time, finish_time_seconds } = await api.finishRacer(waveId, racerId, pin);
      setWaves(ws => ws.map(w => {
        if (w.id !== waveId) return w;
        return {
          ...w,
          racers: w.racers.map(r =>
            r.id === racerId ? { ...r, finish_time, finish_time_seconds } : r
          ),
        };
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setFinishing(f => ({ ...f, [racerId]: false }));
    }
  }

  if (loading) return <div className="py-12 text-center text-gray-500">Loading race day data...</div>;

  if (waves.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-500">
        <p className="mb-2">No waves set up yet.</p>
        <p className="text-xs text-gray-600">Go to the Waves tab to create and assign athletes to waves first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">✕</button>
        </p>
      )}

      {waves.map(wave => {
        const allFinished = wave.racers.length > 0 && wave.racers.every(r => r.finish_time || r.dnf || r.dns);
        const isStarted = !!wave.started_at;
        const finishedCount = wave.racers.filter(r => r.finish_time || r.dnf || r.dns).length;

        return (
          <div key={wave.id} className={`card overflow-hidden ${isStarted && !allFinished ? 'border-brand/40' : ''}`}>
            {/* Wave header */}
            <div className={`px-5 py-4 flex items-center justify-between ${isStarted && !allFinished ? 'bg-brand/5' : ''}`}>
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-display font-bold text-white text-lg uppercase tracking-wide">
                    {wave.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    {wave.scheduled_time && (
                      <span className="text-xs text-gray-500">🕐 {wave.scheduled_time}</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {wave.racers.length} athlete{wave.racers.length !== 1 ? 's' : ''}
                      {isStarted && ` · ${finishedCount}/${wave.racers.length} finished`}
                    </span>
                  </div>
                </div>

                {/* Live timer */}
                {isStarted && !allFinished && (
                  <WaveTimer startedAt={wave.started_at} />
                )}

                {allFinished && isStarted && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30">
                    ✓ Wave Complete
                  </span>
                )}
              </div>

              {!isStarted && (
                <button
                  onClick={() => handleStartWave(wave.id)}
                  disabled={starting[wave.id] || wave.racers.length === 0}
                  className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  {starting[wave.id] ? 'Starting...' : `Start ${wave.name}`}
                </button>
              )}
            </div>

            {/* Athletes grid */}
            {wave.racers.length === 0 ? (
              <div className="px-5 pb-5 text-sm text-gray-600">No athletes assigned to this wave.</div>
            ) : (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {wave.racers.map(racer => {
                  const done = !!(racer.finish_time || racer.dnf || racer.dns);
                  const isFinishing = finishing[racer.id];

                  return (
                    <div
                      key={racer.id}
                      className={`rounded-xl border p-3 flex flex-col items-center text-center gap-2 transition-colors ${
                        done
                          ? 'bg-green-500/10 border-green-500/30'
                          : isStarted
                            ? 'bg-surface-raised border-surface-border hover:border-brand/40'
                            : 'bg-surface border-surface-border opacity-60'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white leading-tight truncate w-full">
                          {displayName(racer)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{racer.category}</p>
                        {racer.bib_number && (
                          <p className="text-xs text-gray-600">#{racer.bib_number}</p>
                        )}
                      </div>

                      {done ? (
                        <div className="text-center">
                          <p className="font-display text-lg font-bold text-green-400 tabular-nums">
                            {racer.dnf ? 'DNF' : racer.dns ? 'DNS' : racer.finish_time}
                          </p>
                          {isStarted && racer.finish_time && (
                            <button
                              onClick={() => handleFinish(wave.id, racer.id)}
                              className="text-xs text-gray-600 hover:text-gray-400 mt-1"
                            >
                              re-tap
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => isStarted && handleFinish(wave.id, racer.id)}
                          disabled={!isStarted || isFinishing}
                          className={`w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
                            isStarted
                              ? 'bg-brand text-black hover:bg-brand/90 active:scale-95'
                              : 'bg-surface-border text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          {isFinishing ? '...' : 'Finish'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <p className="text-xs text-gray-600 text-center">
        Timers are calculated from the server start time — refreshing this page is safe.
      </p>
    </div>
  );
}
