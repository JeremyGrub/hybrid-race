import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-surface-border mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="font-display text-lg font-bold tracking-widest uppercase">
          Race<span className="text-brand">Grid</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/terms" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
            Terms of Service
          </Link>
          <Link to="/privacy" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
            Privacy Policy
          </Link>
          <a href="mailto:support@racegrid.fit" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
            Contact
          </a>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-gray-500 text-xs">
            Independent hybrid fitness event management. Not affiliated with any race organization.
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Built by <span className="text-gray-400 font-medium">GRUB FORGE LLC</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
