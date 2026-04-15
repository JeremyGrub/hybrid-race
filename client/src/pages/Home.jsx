import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Create Events',
    desc: 'Set up sim race events in minutes. Add gym info, date, location, and event type.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Register Racers',
    desc: 'Add athletes by name, category, and age group. Solo, doubles, or relay.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Enter Times',
    desc: 'Post finish times live. Results auto-sort by time and rank athletes instantly.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Live Leaderboard',
    desc: 'Athletes search events and see their results instantly. Filter by category and age group.',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/3 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5 text-xs text-brand font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              Built for hybrid fitness communities
            </div>
            <h1 className="font-display text-6xl sm:text-7xl font-extrabold uppercase leading-none tracking-tight mb-6">
              Run Your
              <br />
              <span className="text-brand">Sim Race</span>
              <br />
              Events.
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-lg">
              Create hybrid fitness sim events, register athletes, post times, and share live leaderboards — all in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/create" className="btn-primary text-base px-7 py-3">
                Create an Event
              </Link>
              <Link to="/events" className="btn-secondary text-base px-7 py-3">
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-surface-border bg-surface/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-3 gap-8 text-center">
          {[
            { value: 'Solo', label: 'Individual' },
            { value: 'Doubles', label: 'Pairs' },
            { value: 'Relay', label: '4-Person' },
          ].map(({ value, label }) => (
            <div key={value}>
              <p className="font-display text-3xl font-bold text-brand">{value}</p>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="section-title text-center mb-12">
          Everything you need to{' '}
          <span className="text-brand">run the day</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="w-11 h-11 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-4">
                {f.icon}
              </div>
              <h3 className="font-display text-lg font-bold uppercase tracking-wide mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="card p-10 text-center bg-gradient-to-br from-brand/5 to-transparent border-brand/20">
          <h2 className="section-title mb-3">Ready to race?</h2>
          <p className="text-gray-400 mb-7">Set up your event in under 2 minutes.</p>
          <Link to="/create" className="btn-primary text-base px-8 py-3 inline-block">
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
