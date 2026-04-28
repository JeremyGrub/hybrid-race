import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken, setStoredGym, getToken } from '../api/client';

export default function GymSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ gym_name: '', location: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) navigate('/dashboard', { replace: true });
  }, [navigate]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); setApiError(''); };

  function validate() {
    const errs = {};
    if (!form.gym_name.trim()) errs.gym_name = 'Required';
    if (!form.location.trim()) errs.location = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Required';
    else if (form.password.length < 8) errs.password = 'At least 8 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      const { token, gym } = await api.signup({
        email: form.email.trim(),
        password: form.password,
        gym_name: form.gym_name.trim(),
        location: form.location.trim(),
      });
      setToken(token);
      setStoredGym(gym);
      navigate('/dashboard');
    } catch(err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="card p-8">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide mb-1">Create Account</h1>
          <p className="text-gray-400 text-sm">Set up your gym on RaceGrid</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Gym Name</label>
            <input
              className="input-field"
              placeholder="Iron Fitness Co."
              value={form.gym_name}
              onChange={e => set('gym_name', e.target.value)}
              autoFocus
            />
            {errors.gym_name && <p className="text-red-400 text-xs mt-1">{errors.gym_name}</p>}
          </div>

          <div>
            <label className="label">Location</label>
            <input
              className="input-field"
              placeholder="Austin, TX"
              value={form.location}
              onChange={e => set('location', e.target.value)}
            />
            {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="gym@example.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              autoComplete="email"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              autoComplete="new-password"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={form.confirm}
              onChange={e => set('confirm', e.target.value)}
              autoComplete="new-password"
            />
            {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
          </div>

          {apiError && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {apiError}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand hover:text-brand-dim transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
