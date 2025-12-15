const KEY = 'cm_bookmarks_v1';

export function getBookmarks() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function isBookmarked(id) {
  return new Set(getBookmarks()).has(id);
}

export function toggleBookmark(id) {
  const set = new Set(getBookmarks());
  let saved;
  if (set.has(id)) { set.delete(id); saved = false; }
  else { set.add(id); saved = true; }
  localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  // cross-tab sync
  window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: JSON.stringify(Array.from(set)) }));
  return saved;
}
