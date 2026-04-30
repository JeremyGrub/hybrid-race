import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import EventCard from '../components/events/EventCard';

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
    title: 'Wave Timing',
    desc: 'Group athletes into waves, start a wave timer, and tap Finish per athlete — times post to results instantly.',
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

// Wires up IntersectionObserver for scroll-reveal on a container ref
function useScrollReveal(ref, stagger = 120) {
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const items = container.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const els = entry.target.querySelectorAll
              ? entry.target.querySelectorAll('.reveal')
              : [entry.target];
            // if the observed element IS a .reveal, just reveal it
            if (entry.target.classList.contains('reveal')) {
              entry.target.classList.add('revealed');
            } else {
              els.forEach((el, i) => {
                setTimeout(() => el.classList.add('revealed'), i * stagger);
              });
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    // observe each .reveal directly for stagger
    items.forEach((el, i) => {
      el.style.transitionDelay = `${i * stagger}ms`;
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ref, stagger]);
}

export default function Home() {
  const featuresRef  = useRef(null);
  const statsRef     = useRef(null);

  useScrollReveal(featuresRef);
  useScrollReveal(statsRef, 100);

  const [upcoming, setUpcoming] = useState([]);
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    api.getEvents().then(events => {
      const future = events
        .filter(e => e.event_date >= today)
        .sort((a, b) => a.event_date.localeCompare(b.event_date))
        .slice(0, 3);
      setUpcoming(future);
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Drifting glow orbs */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full pointer-events-none
                        bg-brand/5 blur-3xl animate-drift -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none
                        bg-brand/3 blur-3xl animate-drift translate-y-1/2 -translate-x-1/4"
             style={{ animationDelay: '-7s', animationDuration: '18s' }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 relative">
          <div className="max-w-2xl">
            {/* Pill badge */}
            <div className="animate-fade-up delay-100 inline-flex items-center gap-2 bg-brand/10 border border-brand/20
                            rounded-full px-4 py-1.5 text-xs text-brand font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              Built for hybrid fitness communities
            </div>

            {/* Headline — each line staggers in */}
            <h1 className="font-display text-6xl sm:text-7xl font-extrabold uppercase leading-none tracking-tight mb-6">
              <span className="block animate-fade-up delay-200">Run Your</span>
              <span className="block animate-shimmer animate-fade-up delay-300">Sim Race</span>
              <span className="block animate-fade-up delay-400">Events.</span>
            </h1>

            <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-lg animate-fade-up delay-500">
              Create hybrid fitness sim events, register athletes, post times, and share live leaderboards — all in one place.
            </p>

            <div className="flex flex-wrap gap-3 animate-fade-up delay-600">
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

      {/* ── Stats strip ──────────────────────────────────── */}
      <section className="border-y border-surface-border bg-surface/50">
        <div ref={statsRef} className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-3 gap-8 text-center">
          {[
            { value: 'Solo',    label: 'Individual' },
            { value: 'Doubles', label: 'Pairs' },
            { value: 'Relay',   label: '4-Person' },
          ].map(({ value, label }) => (
            <div key={value} className="reveal">
              <p className="font-display text-3xl font-bold text-brand">{value}</p>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="section-title text-center mb-12">
          Everything you need to{' '}
          <span className="text-brand">run the day</span>
        </h2>

        <div ref={featuresRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 reveal hover:-translate-y-1 transition-transform duration-200">
              <div className="w-11 h-11 rounded-lg bg-brand/10 border border-brand/20
                              flex items-center justify-center text-brand mb-4">
                {f.icon}
              </div>
              <h3 className="font-display text-lg font-bold uppercase tracking-wide mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Race Day Spotlight ───────────────────────────── */}
      <section className="border-y border-surface-border bg-surface/30 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            {/* Text */}
            <div className="flex-1 max-w-lg">
              <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-3 py-1 text-xs text-brand font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                Race Day Dashboard
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight mb-4">
                Built for the <span className="text-brand">gym floor</span>
              </h2>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                Organize athletes into waves or heats before the event. On race day, hit Start — a live timer runs for every athlete in the wave. Tap one button to stop their clock the moment they finish.
              </p>
              <ul className="space-y-3">
                {[
                  'Group any number of athletes into waves with scheduled start times',
                  'Server-side timer — safe to refresh or hand off between volunteers',
                  'One tap per athlete stops the clock and posts to the leaderboard',
                  'PIN-protected so volunteers can time without a gym login',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-400">
                    <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-brand" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock UI */}
            <div className="flex-1 w-full max-w-sm lg:max-w-md">
              <div className="card overflow-hidden border-brand/20">
                {/* Wave header */}
                <div className="bg-brand/5 border-b border-brand/20 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-white uppercase tracking-wide">Wave 1</p>
                    <p className="text-xs text-gray-500 mt-0.5">4 athletes · 2/4 finished</p>
                  </div>
                  <span className="font-display text-2xl font-bold text-brand tabular-nums">04:32.7</span>
                </div>
                {/* Athlete cards */}
                <div className="p-4 grid grid-cols-2 gap-3">
                  {[
                    { name: 'Jeremy G.', time: '03:44', done: true },
                    { name: 'Wisnton G.', time: '04:01', done: true },
                    { name: 'Lilly G.', time: null, done: false },
                    { name: 'Wrigley G.', time: null, done: false },
                  ].map(a => (
                    <div key={a.name} className={`rounded-xl border p-3 text-center ${a.done ? 'bg-green-500/10 border-green-500/30' : 'bg-surface-raised border-surface-border'}`}>
                      <p className="text-sm font-semibold text-white truncate">{a.name}</p>
                      {a.done ? (
                        <p className="font-display text-lg font-bold text-green-400 mt-1">{a.time}</p>
                      ) : (
                        <div className="mt-2 bg-brand rounded-lg py-1.5 text-xs font-bold text-black uppercase tracking-wide">
                          Finish
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Upcoming Events ──────────────────────────────── */}
      {upcoming.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Upcoming <span className="text-brand">Events</span></h2>
              <p className="text-gray-500 text-sm mt-1">The next races on the calendar</p>
            </div>
            <Link to="/events" className="btn-ghost text-sm hidden sm:block">
              View all →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((event, i) => (
              <div key={event.id} className="animate-fade-up" style={{ animationDelay: `${i * 120}ms`, animationFillMode: 'both' }}>
                <EventCard event={event} />
              </div>
            ))}
          </div>

          <div className="mt-5 sm:hidden">
            <Link to="/events" className="btn-ghost text-sm">View all events →</Link>
          </div>
        </section>
      )}

      {/* ── CTA Banner ───────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-surface-border mt-4">
        {/* grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
             style={{ backgroundImage: 'linear-gradient(#c8ff00 1px, transparent 1px), linear-gradient(90deg, #c8ff00 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        {/* glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-brand/5 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold uppercase tracking-tight mb-2">
              Ready to <span className="text-brand">race?</span>
            </h2>
            <p className="text-gray-400 text-base">Set up your event in under 2 minutes.</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link to="/create" className="btn-primary text-base px-8 py-3">
              Create an Event
            </Link>
            <Link to="/events" className="btn-secondary text-base px-8 py-3">
              Browse Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
