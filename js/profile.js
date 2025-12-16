// /js/profile.js
// Profile page: auth panel + bookmarked cards view.

import { buildHeader, renderCards, refreshAuthBadge } from './ui.js';
import { signIn, signUp, signOut, currentUser } from './auth.js';
import { getBookmarksForUser } from './storage.js';
import { initOrb } from './orb.js';

// We'll lazy import sites to avoid load-order issues on this standalone page
async function getAllSites() {
  // reuse across re-renders
  if (window.__ALL_SITES_CACHE) return window.__ALL_SITES_CACHE;
  try {
    const mod = await import('./dataloader.js');
    const sites = await mod.loadSites();
    window.__ALL_SITES_CACHE = sites || [];
    return window.__ALL_SITES_CACHE;
  } catch (e) {
    console.warn('Could not load sites catalog:', e);
    return [];
  }
}

function mountRoot() {
  let root = document.getElementById('profile-root');
  if (!root) {
    root = document.createElement('section');
    root.id = 'profile-root';
    root.className = 'page';
    document.getElementById('app')?.appendChild(root);
  }
  return root;
}

function html(strings, ...vals) {
  return strings.reduce((acc, s, i) => acc + s + (vals[i] ?? ''), '');
}

/* --------------------- Logged-out view --------------------- */

function renderAuthPanel(root, mode = 'signin') {
  const isIn = mode === 'signin';

  root.innerHTML = html`
    <div class="card" style="max-width:520px;margin:48px auto;">
      <div style="display:flex;gap:6px; margin-bottom:10px;">
        <button class="btn ${isIn ? 'primary' : ''}" id="tab-signin"  type="button">Sign in</button>
        <button class="btn ${!isIn ? 'primary' : ''}" id="tab-signup" type="button">Sign up</button>
      </div>

      <h1 style="margin:10px 0 6px;">${isIn ? 'Welcome back' : 'Create account'}</h1>
      <p class="subtle" style="margin:0 0 14px;">${isIn ? 'Sign in to see your bookmarks.' : 'Sign up to save and sync bookmarks.'}</p>

      <form id="auth-form" novalidate>
        <label style="display:block; margin:10px 0 6px;">Username</label>
        <input id="auth-username" type="text" autocomplete="username"
               placeholder="yourname" required
               style="width:100%;padding:10px;border-radius:10px;background:var(--bg-elev);color:var(--text);border:1px solid var(--border);" />

        <label style="display:block; margin:12px 0 6px;">Password</label>
        <input id="auth-password" type="password" autocomplete="${isIn ? 'current-password' : 'new-password'}"
               placeholder="••••••••" required
               style="width:100%;padding:10px;border-radius:10px;background:var(--bg-elev);color:var(--text);border:1px solid var(--border);" />

        ${!isIn ? html`
          <label style="display:block; margin:12px 0 6px;">Confirm Password</label>
          <input id="auth-password-2" type="password" autocomplete="new-password"
                 placeholder="••••••••" required
                 style="width:100%;padding:10px;border-radius:10px;background:var(--bg-elev);color:var(--text);border:1px solid var(--border);" />
        ` : ''}

        <div id="auth-error" class="subtle" style="color:var(--danger);min-height:20px;margin-top:8px;"></div>

        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
          <button type="submit" class="btn primary">${isIn ? 'Sign in' : 'Create account'}</button>
        </div>
      </form>
    </div>
  `;

  const tabIn  = root.querySelector('#tab-signin');
  const tabUp  = root.querySelector('#tab-signup');
  const form   = root.querySelector('#auth-form');
  const userEl = root.querySelector('#auth-username');
  const pwEl   = root.querySelector('#auth-password');
  const pw2El  = root.querySelector('#auth-password-2');
  const err    = root.querySelector('#auth-error');

  tabIn?.addEventListener('click', () => renderAuthPanel(root, 'signin'));
  tabUp?.addEventListener('click', () => renderAuthPanel(root, 'signup'));

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    const u = (userEl.value || '').trim();
    const p = pwEl.value || '';

    try {
      if (isIn) {
        await signIn(u, p);
      } else {
        const p2 = pw2El?.value || '';
        if (p !== p2) throw new Error('Passwords do not match.');
        await signUp(u, p);
      }
      // Refresh the header badge & rerender to the logged-in view
      refreshAuthBadge();
      render(); // go to logged-in UI
    } catch (ex) {
      err.textContent = ex?.message || String(ex);
    }
  });
}

/* --------------------- Logged-in view --------------------- */

async function renderSignedIn(root, username) {
  root.innerHTML = html`
    <div class="card" style="max-width:820px;margin:32px auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <h1 style="margin:6px 0;">Hello ${username}</h1>
        <button class="btn danger" id="logout-btn">Sign out</button>
      </div>
      <p class="subtle" style="margin:0 0 12px;">Your bookmarked sites</p>
      <div id="profile-bookmarks"></div>
      <div id="empty-note" class="subtle" style="display:none;margin-top:6px;">No bookmarks yet.</div>
    </div>
  `;

  // Hook up sign-out
  root.querySelector('#logout-btn')?.addEventListener('click', async () => {
    await signOut();
    refreshAuthBadge();
    render(); // back to auth panel
  });

  // Load and render bookmarks
  const [sites, ids] = await Promise.all([
    getAllSites(),
    Promise.resolve(getBookmarksForUser(username) || [])
  ]);

  const idSet = new Set(ids);
  const picked = sites.filter(s => idSet.has(s.id));

  const container = root.querySelector('#profile-bookmarks');
  if (!picked.length) {
    root.querySelector('#empty-note').style.display = 'block';
    container.innerHTML = '';
    return;
  }

  // Use the same card renderer; if a bookmark is removed, drop its card.
  renderCards(picked, container, (siteId, nowSaved) => {
    if (!nowSaved) {
      const el = container.querySelector(`#card-${siteId}`);
      el?.parentElement?.removeChild(el);
      // If no cards left, show the note
      if (!container.querySelector('.card')) {
        root.querySelector('#empty-note').style.display = 'block';
      }
    }
  });
}

/* --------------------- Top-level render --------------------- */

function render() {
  const root = mountRoot();
  const user = currentUser();
  if (user) {
    renderSignedIn(root, user);
  } else {
    renderAuthPanel(root, 'signin');
  }
}

/* --------------------- Bootstrap --------------------- */

document.addEventListener('DOMContentLoaded', () => {
  buildHeader('profile');     // header with burger, orb, badge
  initOrb();                  // initialize the orb after header is built
  refreshAuthBadge();         // set initial "Logged in as …" / "Login"
  render();

  // Keep badge in sync if auth changes in another tab
  window.addEventListener('auth:changed', refreshAuthBadge);
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth.user' || e.key === 'app.session') {
      refreshAuthBadge();
    }
  });
});
