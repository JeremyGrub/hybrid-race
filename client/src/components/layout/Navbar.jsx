import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-brand-dark/95 backdrop-blur border-b border-surface-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold tracking-widest uppercase text-white">
            Race<span className="text-brand">Grid</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink
            to="/events"
            className={({ isActive }) =>
              isActive ? 'btn-ghost text-white bg-surface-raised' : 'btn-ghost'
            }
          >
            Events
          </NavLink>
          <Link to="/create" className="btn-primary">
            Create Event
          </Link>
        </nav>
      </div>
    </header>
  );
}
