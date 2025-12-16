// /js/profile.js
import { APP } from './config.js';
import { buildHeader, renderCards } from './ui.js';
import { getBookmarkedIds } from './storage.js';
import { signIn, signUp, signOut, currentUser } from './auth.js';
import { loadSites } from './dataLoader.js'; // assumes this exists in your app

const root = document.getElementById('profile-root');
const cardsEl = document.getElementById('profile-bookmarks');

buildHeader('profile');

let ALL_SITES = [];
(async function init(){
  try {
    ALL_SITES = await loadSites(); // should return an array of site objects
  } catch (e) {
    // Fallback: if you don’t have loadSites exported, comment the call above
    // and set ALL_SITES from a global if you expose it in your app.
    console.warn('loadSites() failed or not exported:', e);
  }
  render();
})();

function render(){
  const user = currentUser();
  if (!user) return renderAuth();
  return renderProfile(user);
}

function renderAuth(msg=''){
  cardsEl.innerHTML = ''; // no bookmarks for guests (still visible if you want)
  root.innerHTML = `
    <h2>Sign in / Create account</h2>
    ${msg ? `<div class="subtle-row">${msg}</div>` : ''}
    <form class="auth-form" id="auth-form">
      <div>
        <label for="auth-user">Username</label>
        <input id="auth-user" name="username" type="text" autocomplete="username" required />
      </div>
      <div>
        <label for="auth-pass">Password</label>
        <input id="auth-pass" name="password" type="password" autocomplete="current-password" required />
      </div>
      <div class="auth-actions">
        <button type="submit" class="btn primary" data-action="signin">Sign in</button>
        <button type="button" class="btn" data-action="signup">Create account</button>
      </div>
    </form>
  `;

  const form = document.getElementById('auth-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const u = (fd.get('username') || '').toString();
    const p = (fd.get('password') || '').toString();
    try {
      signIn(u, p);
      render();
    } catch (err) {
      renderAuth(`⚠️ ${err.message}`);
    }
  };
  form.querySelector('[data-action="signup"]').onclick = () => {
    const fd = new FormData(form);
    const u = (fd.get('username') || '').toString();
    const p = (fd.get('password') || '').toString();
    try {
      signUp(u, p);
      render();
    } catch (err) {
      renderAuth(`⚠️ ${err.message}`);
    }
  };
}

function renderProfile(username){
  root.innerHTML = `
    <div class="hello">Hello ${escapeHtml(username)}</div>
    <div class="subtle-row">Your bookmarked sites:</div>
    <div class="auth-actions">
      <button class="btn" id="logout-btn">Log out</button>
    </div>
  `;

  // Show bookmarked cards
  const ids = new Set(getBookmarkedIds());
  const sites = (ALL_SITES || []).filter(s => ids.has(s.id));
  renderCards(sites, cardsEl);

  document.getElementById('logout-btn').onclick = () => {
    signOut();
    render();
  };
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
