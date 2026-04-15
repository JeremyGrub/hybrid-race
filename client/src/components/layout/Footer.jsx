import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-surface-border mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="font-display text-lg font-bold tracking-widest uppercase">
          Race<span className="text-brand">Grid</span>
        </Link>
        <p className="text-gray-500 text-xs">
          Independent hybrid fitness event management. Not affiliated with any race organization.
        </p>
      </div>
    </footer>
  );
}
