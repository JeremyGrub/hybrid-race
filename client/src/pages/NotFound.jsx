import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
      <p className="font-display text-8xl font-extrabold text-brand/20 mb-4">404</p>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide mb-3">Page Not Found</h1>
      <p className="text-gray-400 mb-8">That page doesn't exist.</p>
      <Link to="/" className="btn-primary">Go Home</Link>
    </div>
  );
}
