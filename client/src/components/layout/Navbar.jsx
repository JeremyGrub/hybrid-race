import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getToken, getStoredGym, clearToken } from '../../api/client';

export default function Navbar() {
  const navigate = useNavigate();
  const token = getToken();
  const gym = getStoredGym();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    clearToken();
    setMenuOpen(false);
    window.location.href = '/';
  }

  function close() { setMenuOpen(false); }

  return (
    <header className="sticky top-0 z-50 bg-brand-dark/95 backdrop-blur border-b border-surface-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" onClick={close} className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold tracking-widest uppercase text-white">
            Race<span className="text-brand">Grid</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2">
          <NavLink
            to="/events"
            className={({ isActive }) =>
              isActive ? 'btn-ghost text-white bg-surface-raised' : 'btn-ghost'
            }
          >
            Events
          </NavLink>

          {token && gym ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? 'btn-ghost text-white bg-surface-raised' : 'btn-ghost'
                }
              >
                {gym.gym_name}
              </NavLink>
              <button onClick={handleLogout} className="btn-ghost text-gray-500 hover:text-red-400">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive ? 'btn-ghost text-white bg-surface-raised' : 'btn-ghost'
                }
              >
                Gym Login
              </NavLink>
              <Link to="/create" className="btn-primary">
                Create Event
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 text-gray-400 hover:text-white transition-colors"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-surface-border bg-brand-dark/98 px-4 py-3 space-y-1">
          <NavLink
            to="/events"
            onClick={close}
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-surface-raised text-white' : 'text-gray-400 hover:text-white hover:bg-surface-raised'}`
            }
          >
            Events
          </NavLink>

          {token && gym ? (
            <>
              <NavLink
                to="/dashboard"
                onClick={close}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-surface-raised text-white' : 'text-gray-400 hover:text-white hover:bg-surface-raised'}`
                }
              >
                {gym.gym_name}
              </NavLink>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-surface-raised transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                onClick={close}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-surface-raised text-white' : 'text-gray-400 hover:text-white hover:bg-surface-raised'}`
                }
              >
                Gym Login
              </NavLink>
              <div className="pt-1 pb-0.5">
                <Link to="/create" onClick={close} className="btn-primary block text-center text-sm">
                  Create Event
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
