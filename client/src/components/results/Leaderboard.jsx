import { CategoryBadge, AgeGroupBadge, DivisionBadge, StatusBadge } from '../ui/Badge';

function displayName(racer) {
  if (racer.team_name) return racer.team_name;
  const parts = [racer.first_name, racer.last_name].filter(Boolean);
  return parts.join(' ') || '—';
}

function RankCell({ rank, dnf, dns }) {
  if (dnf) return <StatusBadge status="DNF" />;
  if (dns) return <StatusBadge status="DNS" />;
  if (!rank) return <span className="text-gray-500">—</span>;

  const medals = { 1: 'text-yellow-400', 2: 'text-gray-300', 3: 'text-orange-400' };
  return (
    <span className={`font-display text-lg font-bold ${medals[rank] || 'text-white'}`}>
      {rank}
    </span>
  );
}

export default function Leaderboard({ results, showCategory = false }) {
  const hasDivision = results && results.some(r => r.division);
  const hasAgeGroup = results && results.some(r => r.age_group);

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">No results yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-14">#</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Athlete / Team</th>
            {showCategory && (
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
            )}
            {hasDivision && (
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Division</th>
            )}
            {hasAgeGroup && (
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Age Group</th>
            )}
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Bib</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
          </tr>
        </thead>
        <tbody>
          {results.map((racer, i) => {
            const finished = !racer.dnf && !racer.dns && racer.finish_time;
            return (
              <tr
                key={racer.id}
                className={`border-b border-surface-border/50 ${
                  finished ? 'hover:bg-surface-raised/50' : 'opacity-50'
                } transition-colors`}
              >
                <td className="py-3.5 px-4">
                  <RankCell rank={racer.rank} dnf={racer.dnf} dns={racer.dns} />
                </td>
                <td className="py-3.5 px-4">
                  <span className={`font-medium ${racer.rank === 1 ? 'text-brand' : 'text-white'}`}>
                    {displayName(racer)}
                  </span>
                </td>
                {showCategory && (
                  <td className="py-3.5 px-4 hidden sm:table-cell">
                    <CategoryBadge category={racer.category} />
                  </td>
                )}
                {hasDivision && (
                  <td className="py-3.5 px-4 hidden sm:table-cell">
                    <DivisionBadge division={racer.division} />
                  </td>
                )}
                {hasAgeGroup && (
                  <td className="py-3.5 px-4 hidden sm:table-cell">
                    <AgeGroupBadge group={racer.age_group} />
                  </td>
                )}
                <td className="py-3.5 px-4 hidden md:table-cell text-gray-500">
                  {racer.bib_number || '—'}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {finished ? (
                    <span className="font-display text-lg font-semibold text-white">
                      {racer.finish_time}
                    </span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
