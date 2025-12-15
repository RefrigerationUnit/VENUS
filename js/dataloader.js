export async function loadSites() {
  const res = await fetch('/data/sites.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load sites.json');
  const data = await res.json();
  // Basic validation
  return data.filter(s =>
    s && s.id && s.name && s.state && typeof s.lat === 'number' && typeof s.lon === 'number'
  );
}
