const CATEGORY_COLORS = {
  'Solo Men':      'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Solo Women':    'bg-pink-500/15 text-pink-400 border-pink-500/20',
  'Doubles Men':   'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'Doubles Women': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'Doubles Mixed': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'Relay':         'bg-green-500/15 text-green-400 border-green-500/20',
};

const AGE_COLORS = {
  'Open':  'bg-brand/15 text-brand border-brand/20',
  'Pro':   'bg-yellow-400/15 text-yellow-400 border-yellow-400/20',
  '40-49': 'bg-gray-500/15 text-gray-300 border-gray-500/20',
  '50-59': 'bg-gray-500/15 text-gray-300 border-gray-500/20',
  '60-69': 'bg-gray-500/15 text-gray-300 border-gray-500/20',
  '70+':   'bg-gray-500/15 text-gray-300 border-gray-500/20',
};

export function CategoryBadge({ category }) {
  const color = CATEGORY_COLORS[category] || 'bg-gray-500/15 text-gray-400 border-gray-500/20';
  return (
    <span className={`badge border ${color}`}>{category}</span>
  );
}

export function AgeGroupBadge({ group }) {
  const color = AGE_COLORS[group] || 'bg-gray-500/15 text-gray-400 border-gray-500/20';
  return (
    <span className={`badge border ${color}`}>{group}</span>
  );
}

export function StatusBadge({ status }) {
  if (status === 'DNF') return <span className="badge bg-red-500/15 text-red-400 border border-red-500/20">DNF</span>;
  if (status === 'DNS') return <span className="badge bg-gray-500/15 text-gray-400 border border-gray-500/20">DNS</span>;
  return null;
}
