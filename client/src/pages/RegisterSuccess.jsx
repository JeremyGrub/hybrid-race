import { useSearchParams, Link } from 'react-router-dom';

export default function RegisterSuccess() {
  const [params] = useSearchParams();
  const isFree = params.get('free') === 'true';

  return (
    <div className="max-w-lg mx-auto px-4 py-20">
      <div className="card p-10 text-center">
        <div className="w-16 h-16 bg-brand/15 border border-brand/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="font-display text-3xl font-bold uppercase tracking-wide mb-2">
          {isFree ? "You're Registered!" : "Payment Complete!"}
        </h1>
        <p className="text-gray-400 mb-6">
          {isFree
            ? "Your free registration has been confirmed. You're all set for race day!"
            : "Your payment was successful and your registration is confirmed. See you on race day!"}
        </p>

        <div className="bg-surface-raised border border-surface-border rounded-xl p-5 mb-8 text-left space-y-2">
          <p className="text-sm text-gray-400">
            <span className="text-white font-medium">What&apos;s next:</span>
          </p>
          <ul className="text-sm text-gray-400 space-y-1.5 list-disc list-inside">
            <li>A confirmation email will be sent to you</li>
            <li>Check the event page for schedule updates and results</li>
            <li>Arrive early to collect your race bib</li>
          </ul>
        </div>

        <Link to="/events" className="btn-primary w-full py-3">
          Browse More Events
        </Link>
      </div>
    </div>
  );
}
