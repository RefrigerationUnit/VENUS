// filters.js

export const defaultFilter = () => ({
  states: new Set([
    'AL','AZ','AR','CA','CO','CT','DE','FL','GA','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI',
    'MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
    'TX','UT','VT','VA','WA','WV','WI','WY','DC' // keep DC only if your data uses it
  ]),
  types: new Set(['industrial_building','industrial_shell','industrial_land']),
  search: '',
  sortBy: 'name_asc' // name_asc | size_desc
});

// If false: empty set => show NONE (matches your "clear all shows nothing")
const EMPTY_SHOWS_ALL = false;

export function applyFilters(sites, state) {
  // allow either state or state.filters to be passed in
  const f = state.filters ? state.filters : state;

  const byState = (s) =>
    f.states.size === 0 ? EMPTY_SHOWS_ALL : f.states.has(s.state);

  const byType = (s) =>
    f.types.size === 0 ? EMPTY_SHOWS_ALL : f.types.has(s.asset_type);

  const q = f.search.trim().toLowerCase();
  const bySearch = (s) => {
    if (!q) return true;
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) ||
      (s.state || '').toLowerCase().includes(q)
    );
  };

  const out = sites
    .filter(byState)
    .filter(byType)
    .filter(bySearch);

  out.sort(sorter(f.sortBy));
  return out;
}

function sorter(key) {
  if (key === 'size_desc') return (a, b) => (b.size_sqft || 0) - (a.size_sqft || 0);
  return (a, b) => (a.name || '').localeCompare(b.name || '');
}
