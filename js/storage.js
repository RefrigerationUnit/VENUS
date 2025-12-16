// /js/storage.js
// User-aware bookmarks stored per username. Falls back to "guest".

import { currentUser } from './auth.js';

const BK_PREFIX = 'bookmarks:'; // per-user key: bookmarks:USERNAME

function keyFor(user){
  return BK_PREFIX + (user || 'guest');
}

export function getBookmarksForUser(username){
  try { return JSON.parse(localStorage.getItem(keyFor(username))) || []; }
  catch { return []; }
}
export function setBookmarksForUser(username, ids){
  localStorage.setItem(keyFor(username), JSON.stringify(ids || []));
}

function activeUser(){
  return currentUser() || 'guest';
}

export function getBookmarkedIds(){
  return getBookmarksForUser(activeUser());
}

export function isBookmarked(siteId){
  const ids = getBookmarkedIds();
  return ids.includes(siteId);
}

export function toggleBookmark(siteId){
  const user = activeUser();
  const ids = getBookmarksForUser(user);
  const idx = ids.indexOf(siteId);
  let nowSaved = false;
  if (idx >= 0){ ids.splice(idx, 1); nowSaved = false; }
  else { ids.push(siteId); nowSaved = true; }
  setBookmarksForUser(user, ids);
  return nowSaved;
}
