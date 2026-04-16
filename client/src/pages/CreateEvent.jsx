import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const EVENT_TYPES = ['Solo Men', 'Solo Women', 'Doubles Men', 'Doubles Women', 'Doubles Mixed', 'Relay'];

function Field({ label, id, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    event_name: '',
    gym_name: '',
    location: '',
    event_date: '',
    event_types: [],
    registration_link: '',
    description: '',
    pin: '',
    pin_confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: null }));
  };

  function toggleType(type) {
    setForm(f => {
      const has = f.event_types.includes(type);
      return { ...f, event_types: has ? f.event_types.filter(t => t !== type) : [...f.event_types, type] };
    });
    setErrors(e => ({ ...e, event_types: null }));
  }

  function validate() {
    const errs = {};
    if (!form.event_name.trim()) errs.event_name = 'Required';
    if (!form.gym_name.trim()) errs.gym_name = 'Required';
    if (!form.location.trim()) errs.location = 'Required';
    if (!form.event_date) errs.event_date = 'Required';
    if (!form.event_types.length) errs.event_types = 'Select at least one event type';
    if (!form.pin) errs.pin = 'Required';
    else if (!/^\d{4,6}$/.test(form.pin)) errs.pin = '4–6 digit number';
    if (form.pin !== form.pin_confirm) errs.pin_confirm = 'PINs do not match';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError(null);
    try {
      const result = await api.createEvent({
        event_name: form.event_name.trim(),
        gym_name: form.gym_name.trim(),
        location: form.location.trim(),
        event_date: form.event_date,
        event_type: JSON.stringify(form.event_types),
        registration_link: form.registration_link.trim() || undefined,
        description: form.description.trim() || undefined,
        pin: form.pin,
      });
      sessionStorage.setItem(`event-pin-${result.id}`, form.pin);
      navigate(`/events/${result.id}/manage`);
    } catch (err) {
      setApiError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="section-title mb-1">Create Event</h1>
        <p className="text-gray-400 text-sm">Set up your sim race event</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-6 space-y-5">
          <h2 className="font-display text-base font-bold uppercase tracking-widest text-gray-400">Event Info</h2>

          <Field label="Event Name" id="event_name" error={errors.event_name}>
            <input
              id="event_name"
              className="input-field"
              placeholder="Spring Sim Race 2026"
              value={form.event_name}
              onChange={e => set('event_name', e.target.value)}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Gym Name" id="gym_name" error={errors.gym_name}>
              <input
                id="gym_name"
                className="input-field"
                placeholder="Iron Fitness Co."
                value={form.gym_name}
                onChange={e => set('gym_name', e.target.value)}
              />
            </Field>
            <Field label="Location" id="location" error={errors.location}>
              <input
                id="location"
                className="input-field"
                placeholder="Austin, TX"
                value={form.location}
                onChange={e => set('location', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Event Date" id="event_date" error={errors.event_date}>
            <input
              id="event_date"
              type="date"
              className="input-field"
              value={form.event_date}
              onChange={e => set('event_date', e.target.value)}
            />
          </Field>

          {/* Multi-select event types */}
          <div>
            <p className="label">Event Types</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {EVENT_TYPES.map(type => {
                const active = form.event_types.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      active
                        ? 'bg-brand text-black border-brand'
                        : 'bg-surface-raised text-gray-400 border-surface-border hover:text-white hover:border-gray-500'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
            {errors.event_types && <p className="text-red-400 text-xs mt-1.5">{errors.event_types}</p>}
          </div>

          <Field label="Registration Link (optional)" id="registration_link">
            <input
              id="registration_link"
              type="url"
              className="input-field"
              placeholder="https://your-registration-link.com"
              value={form.registration_link}
              onChange={e => set('registration_link', e.target.value)}
            />
          </Field>

          <Field label="Description (optional)" id="description">
            <textarea
              id="description"
              className="input-field resize-none"
              rows={3}
              placeholder="Event details, schedule, rules..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </Field>
        </div>

        {/* PIN */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-bold uppercase tracking-widest text-gray-400">Event PIN</h2>
            <p className="text-xs text-gray-500 mt-1">You'll use this to manage racers and enter times. Save it — you'll need it.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="PIN (4–6 digits)" id="pin" error={errors.pin}>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="\d{4,6}"
                className="input-field tracking-widest"
                placeholder="••••"
                value={form.pin}
                onChange={e => set('pin', e.target.value)}
                maxLength={6}
              />
            </Field>
            <Field label="Confirm PIN" id="pin_confirm" error={errors.pin_confirm}>
              <input
                id="pin_confirm"
                type="password"
                inputMode="numeric"
                pattern="\d{4,6}"
                className="input-field tracking-widest"
                placeholder="••••"
                value={form.pin_confirm}
                onChange={e => set('pin_confirm', e.target.value)}
                maxLength={6}
              />
            </Field>
          </div>
        </div>

        {apiError && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{apiError}</p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
          {submitting ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}
