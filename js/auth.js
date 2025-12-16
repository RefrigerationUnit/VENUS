// /js/auth.js
// Simple, demo-only local auth using localStorage.

const USERS_KEY = 'app.users';   // object map: username -> { pw: 'hash', createdAt }
const SESSION_KEY = 'app.session'; // { username: '...' } or null

function readUsers(){
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch { return {}; }
}
function writeUsers(obj){
  localStorage.setItem(USERS_KEY, JSON.stringify(obj));
}
function setSession(username){
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
}
function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}
export function currentUser(){
  try { return JSON.parse(localStorage.getItem(SESSION_KEY))?.username || null; }
  catch { return null; }
}

// ⚠️ DEMO hash: DO NOT use for production
function hash(pw){
  let h = 0;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) - h) + pw.charCodeAt(i), h |= 0;
  return String(h);
}

export function signUp(username, password){
  username = (username || '').trim();
  if (!username || !password) throw new Error('Username and password are required.');
  const users = readUsers();
  if (users[username]) throw new Error('That username is already taken.');

  users[username] = { pw: hash(password), createdAt: Date.now() };
  writeUsers(users);
  // create session
  setSession(username);

  // merge guest bookmarks into this user
  import('./storage.js').then(({ getBookmarksForUser, setBookmarksForUser }) => {
    const guest = getBookmarksForUser('guest');
    const existing = getBookmarksForUser(username);
    const merged = Array.from(new Set([...(existing||[]), ...(guest||[])]));
    setBookmarksForUser(username, merged);
    setBookmarksForUser('guest', []);
  });

  return username;
}

export function signIn(username, password){
  username = (username || '').trim();
  const users = readUsers();
  const rec = users[username];
  if (!rec) throw new Error('No such user.');
  if (rec.pw !== hash(password)) throw new Error('Incorrect password.');
  setSession(username);

  // merge guest bookmarks into this user
  import('./storage.js').then(({ getBookmarksForUser, setBookmarksForUser }) => {
    const guest = getBookmarksForUser('guest');
    const existing = getBookmarksForUser(username);
    const merged = Array.from(new Set([...(existing||[]), ...(guest||[])]));
    setBookmarksForUser(username, merged);
    setBookmarksForUser('guest', []);
  });

  return username;
}

export function signOut(){
  clearSession();
}
