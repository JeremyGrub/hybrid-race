const CATEGORY_ORDER = ['Solo Men', 'Solo Women', 'Doubles Men', 'Doubles Women', 'Doubles Mixed', 'Relay'];
const AGE_GROUPS = ['All Ages', 'Open', 'Pro', '40-49', '50-59', '60-69', '70+'];

export default function CategoryTabs({ results, activeCategory, onCategoryChange, activeAgeGroup, onAgeGroupChange }) {
  const presentCategories = CATEGORY_ORDER.filter(c =>
    results.some(r => r.category === c)
  );

  if (presentCategories.length === 0) return null;

  // Determine which age groups are present in the active category
  const ageGroupsInCategory = AGE_GROUPS.filter(ag => {
    if (ag === 'All Ages') return true;
    return results.some(r => r.category === activeCategory && r.age_group === ag);
  });

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {presentCategories.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-brand text-black'
                : 'bg-surface-raised text-gray-400 hover:text-white border border-surface-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Age group sub-filter */}
      {ageGroupsInCategory.length > 2 && (
        <div className="flex flex-wrap gap-1.5">
          {ageGroupsInCategory.map(ag => (
            <button
              key={ag}
              onClick={() => onAgeGroupChange(ag === 'All Ages' ? null : ag)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                (ag === 'All Ages' && !activeAgeGroup) || activeAgeGroup === ag
                  ? 'bg-surface-border text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {ag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
