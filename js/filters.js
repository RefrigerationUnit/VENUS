export const defaultFilter = () => ({
  states: new Set([
    'AL','AZ','AR','CA','CO','CT','DE','FL','GA','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI',
    'MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
    'TX','UT','VT','VA','WA','WV','WI','WY','DC'
  ]),
  types: new Set(['industrial_building','industrial_shell','industrial_land']),
  search: '',
  sortBy: 'name_asc' // name_asc | size_desc
});

export function applyFilters(sites, f) {
  const text = f.search.trim().toLowerCase();
  let out = sites.filter(s =>
    f.states.has(s.state) &&
    f.types.has(s.asset_type) &&
    (text === '' ||
      (s.name && s.name.toLowerCase().includes(text)) ||
      (s.city && s.city.toLowerCase().includes(text)))
  );
  if (f.sortBy === 'name_asc') {
    out.sort((a,b) => (a.name||'').localeCompare(b.name||''));
  } else if (f.sortBy === 'size_desc') {
    out.sort((a,b) => (Number(b.size_sqft||0) - Number(a.size_sqft||0)));
  }
  return out;
}
