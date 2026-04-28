import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken, setStoredGym, getToken } from '../api/client';

export default function GymLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) navigate('/dashboard', { replace: true });
  }, [navigate]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Email and password are required'); return; }
    setLoading(true);
    setError('');
    try {
      const { token, gym } = await api.login({ email: form.email.trim(), password: form.password });
      setToken(token);
      setStoredGym(gym);
      navigate('/dashboard');
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="card p-8">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide mb-1">Gym Login</h1>
          <p className="text-gray-400 text-sm">Access your RaceGrid dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="gym@example.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-brand hover:text-brand-dim transition-colors font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
