// /js/auth.js
// Demo-only local auth using localStorage. Do NOT use in production.

// Storage keys
const USERS_KEY   = 'app.users';   // map: username -> { pw: 'hash', createdAt }
const SESSION_KEY = 'app.session'; // { username: '...' } or null

// ---------- internals ----------
function readUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch { return {}; }
}
function writeUsers(obj) {
  localStorage.setItem(USERS_KEY, JSON.stringify(obj));
}
function setSession(username) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Fire an app-wide event so headers / pages can react (no hard import)
function setUser(username) {
  localStorage.setItem('auth.user', username);
  window.dispatchEvent(new Event('auth:changed'));
}
function clearUser() {
  localStorage.removeItem('auth.user');
  window.dispatchEvent(new Event('auth:changed'));
}

// Super basic hash (demo only!)
function hash(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) {
    h = ((h << 5) - h) + pw.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

// ---------- public API ----------
export function currentUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY))?.username || null; }
  catch { return null; }
}

export async function signUp(username, password) {
  username = (username || '').trim();
  if (!username || !password) throw new Error('Username and password are required.');

  const users = readUsers();
  if (users[username]) throw new Error('That username is already taken.');

  users[username] = { pw: hash(password), createdAt: Date.now() };
  writeUsers(users);

  // create session + broadcast
  setSession(username);
  setUser(username);

  // Merge guest bookmarks into this new account
  try {
    const { getBookmarksForUser, setBookmarksForUser } = await import('./storage.js');
    const guest    = getBookmarksForUser('guest') || [];
    const existing = getBookmarksForUser(username) || [];
    const merged   = Array.from(new Set([...existing, ...guest]));
    setBookmarksForUser(username, merged);
    setBookmarksForUser('guest', []);
  } catch (e) {
    console.warn('Bookmark merge (signUp) failed:', e);
  }

  return username;
}

export async function signIn(username, password) {
  username = (username || '').trim();
  if (!username || !password) throw new Error('Username and password are required.');

  const users = readUsers();
  const rec = users[username];
  if (!rec) throw new Error('No such user.');
  if (rec.pw !== hash(password)) throw new Error('Incorrect password.');

  // create session + broadcast
  setSession(username);
  setUser(username);

  // Merge guest bookmarks into this account
  try {
    const { getBookmarksForUser, setBookmarksForUser } = await import('./storage.js');
    const guest    = getBookmarksForUser('guest') || [];
    const existing = getBookmarksForUser(username) || [];
    const merged   = Array.from(new Set([...existing, ...guest]));
    setBookmarksForUser(username, merged);
    setBookmarksForUser('guest', []);
  } catch (e) {
    console.warn('Bookmark merge (signIn) failed:', e);
  }

  return username;
}

export function signOut() {
  clearSession();
  clearUser(); // emits 'auth:changed'
}
