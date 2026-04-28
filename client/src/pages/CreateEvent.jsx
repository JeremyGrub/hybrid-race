import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, getToken, getStoredGym } from '../api/client';
import Modal from '../components/ui/Modal';

const EVENT_TYPES = ['Solo Men', 'Solo Women', 'Doubles Men', 'Doubles Women', 'Doubles Mixed', 'Relay'];

function Field({ label, id, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-1.5">{hint}</p>}
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const gym = getStoredGym();

  const [form, setForm] = useState({
    event_name: '',
    location: gym?.location || '',
    event_date: '',
    event_types: [],
    description: '',
    price: '',
    use_divisions: false,
    use_age_groups: false,
  });
  const [waiverFile, setWaiverFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [pinModal, setPinModal] = useState(false);
  const [createdPin, setCreatedPin] = useState('');
  const [createdEventId, setCreatedEventId] = useState(null);
  const [pinCopied, setPinCopied] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!getToken()) navigate('/login', { replace: true });
  }, [navigate]);

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
    if (!form.location.trim()) errs.location = 'Required';
    if (!form.event_date) errs.event_date = 'Required';
    if (!form.event_types.length) errs.event_types = 'Select at least one event type';
    const priceNum = parseFloat(form.price);
    if (form.price !== '' && form.price !== '0' && (isNaN(priceNum) || priceNum < 0)) {
      errs.price = 'Enter a valid price (0 for free)';
    }
    if (waiverFile && waiverFile.type !== 'application/pdf') {
      errs.waiver = 'Only PDF files are allowed';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError(null);
    try {
      const formData = new FormData();
      formData.append('event_name', form.event_name.trim());
      formData.append('location', form.location.trim());
      formData.append('event_date', form.event_date);
      formData.append('event_type', JSON.stringify(form.event_types));
      formData.append('description', form.description.trim());
      formData.append('price', form.price || '0');
      formData.append('use_divisions', form.use_divisions ? '1' : '0');
      formData.append('use_age_groups', form.use_age_groups ? '1' : '0');
      if (waiverFile) formData.append('waiver', waiverFile);

      const result = await api.createEvent(formData);
      setCreatedPin(result.pin);
      setCreatedEventId(result.id);
      setPinModal(true);
    } catch (err) {
      setApiError(err.message);
      setSubmitting(false);
    }
  }

  function copyPin() {
    navigator.clipboard.writeText(createdPin).then(() => {
      setPinCopied(true);
      setTimeout(() => setPinCopied(false), 2000);
    });
  }

  function handlePinDismiss() {
    setPinModal(false);
    navigate(`/events/${createdEventId}/manage`);
  }

  if (!getToken()) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-300 text-xs">← Dashboard</Link>
        </div>
        <h1 className="section-title mb-1">Create Event</h1>
        <p className="text-gray-400 text-sm">Set up your hybrid race event for <span className="text-white">{gym?.gym_name}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Event Info */}
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

          <Field label="Location" id="location" error={errors.location}>
            <input
              id="location"
              className="input-field"
              placeholder="Austin, TX"
              value={form.location}
              onChange={e => set('location', e.target.value)}
            />
          </Field>

          <Field label="Event Date" id="event_date" error={errors.event_date}>
            <input
              id="event_date"
              type="date"
              className="input-field"
              value={form.event_date}
              onChange={e => set('event_date', e.target.value)}
            />
          </Field>

          {/* Event types */}
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

        {/* Registration Config */}
        <div className="card p-6 space-y-5">
          <h2 className="font-display text-base font-bold uppercase tracking-widest text-gray-400">Registration</h2>

          <Field
            label="Registration Price"
            id="price"
            error={errors.price}
            hint="Enter 0 for free events. Paid events use Stripe Checkout."
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                className="input-field pl-7"
                placeholder="0.00"
                value={form.price}
                onChange={e => set('price', e.target.value)}
              />
            </div>
          </Field>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.use_divisions}
                  onChange={e => set('use_divisions', e.target.checked)}
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${form.use_divisions ? 'bg-brand' : 'bg-surface-raised border border-surface-border'}`} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.use_divisions ? 'translate-x-5' : ''}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Use Divisions (Open / Pro)</p>
                <p className="text-xs text-gray-500">Athletes can select a competitive division</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.use_age_groups}
                  onChange={e => set('use_age_groups', e.target.checked)}
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${form.use_age_groups ? 'bg-brand' : 'bg-surface-raised border border-surface-border'}`} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.use_age_groups ? 'translate-x-5' : ''}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Use Age Groups</p>
                <p className="text-xs text-gray-500">U30, 30-39, 40-49, 50-59, 60-69, 70+</p>
              </div>
            </label>
          </div>

          {/* Waiver upload */}
          <div>
            <label className="label">Event Waiver (optional)</label>
            <p className="text-xs text-gray-500 mb-1.5">PDF only, max 10MB. Athletes will be required to agree before registering.</p>
            <div
              className="border border-dashed border-surface-border rounded-lg p-4 text-center cursor-pointer hover:border-brand/40 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {waiverFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-white">
                  <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {waiverFile.name}
                  <button
                    type="button"
                    onClick={ev => { ev.stopPropagation(); setWaiverFile(null); if(fileRef.current) fileRef.current.value = ''; }}
                    className="text-gray-500 hover:text-red-400 ml-1"
                  >✕</button>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Click to upload PDF waiver</p>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => { setWaiverFile(e.target.files[0] || null); setErrors(er => ({ ...er, waiver: null })); }}
            />
            {errors.waiver && <p className="text-red-400 text-xs mt-1">{errors.waiver}</p>}
          </div>
        </div>

        {apiError && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{apiError}</p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
          {submitting ? 'Creating...' : 'Create Event'}
        </button>
      </form>

      {/* PIN reveal modal */}
      <Modal open={pinModal} onClose={() => {}} title="Event Created!">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Your event has been created. Here is your race-day entry PIN — this is the only time it will be shown.
          </p>
          <div className="bg-surface-raised border border-surface-border rounded-xl p-5 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Race-Day PIN</p>
            <p className="font-display text-5xl font-bold tracking-widest text-brand">{createdPin}</p>
          </div>
          <div className="bg-brand/5 border border-brand/20 rounded-lg p-3">
            <p className="text-xs text-gray-400">
              <span className="text-brand font-medium">Save this PIN.</span> Volunteers use it on race day to enter finish times. It is not used for online registration.
            </p>
          </div>
          <button
            type="button"
            onClick={copyPin}
            className="btn-secondary w-full"
          >
            {pinCopied ? '✓ Copied!' : 'Copy PIN'}
          </button>
          <button
            type="button"
            onClick={handlePinDismiss}
            className="btn-primary w-full"
          >
            Go to Event Dashboard
          </button>
        </div>
      </Modal>
    </div>
  );
}
