// /js/ui.js
import { APP } from './config.js';
import { isBookmarked, toggleBookmark } from './storage.js';
import { currentUser } from './auth.js'; // used for the header auth badge

/* ---------- Header (brand + auth badge + burger) ---------- */
export function buildHeader(active = 'home') {
  const el = document.getElementById('app-header');
  if (!el) return;

  el.innerHTML = `
    <div class="brand">
      <a id="orb-sphere" class="orb-container in-brand" href="./index.html" title="Go to Home" aria-label="Home"></a>
      <span class="logo-bubble">${APP.name}</span>
    </div>

    <div class="hdr-right">
      <a id="auth-status" class="hdr-auth" href="./profile.html" title="Open profile"></a>
      <button class="menu-toggle" id="menu-toggle" aria-haspopup="true" aria-expanded="false">
        <span class="bar"></span><span class="bar"></span><span class="bar"></span>
      </button>
    </div>
  `;

  // glossy title sheen follows pointer
  const bubble = el.querySelector('.logo-bubble');
  const headerRect = () => el.getBoundingClientRect();
  function moveSheen(e) {
    const r = headerRect();
    const x = ((e.clientX - r.left) / Math.max(1, r.width)) * 100;
    const y = ((e.clientY - r.top) / Math.max(1, r.height)) * 100;
    bubble.style.setProperty('--mx', x + '%');
    bubble.style.setProperty('--my', y + '%');
  }
  el.addEventListener('pointermove', moveSheen, { passive: true });
  el.addEventListener('pointerleave', () => {
    bubble.style.setProperty('--mx', '50%');
    bubble.style.setProperty('--my', '40%');
  }, { passive: true });

  // Auth badge text
  refreshAuthBadge();

  // Build (or reuse) the floating menu panel
  let panel = document.getElementById('menu-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'menu-panel';
    panel.className = 'menu-panel';
    panel.innerHTML = `
      <a class="item ${active==='home'?'active':''}" href="./index.html">Home</a>
      <a class="item ${active==='contacts'?'active':''}" href="./contacts.html">Contacts</a>
      <a class="item ${active==='profile'?'active':''}" href="./profile.html">User Profile</a>
    `;
    document.body.appendChild(panel);
  }

  const toggle = document.getElementById('menu-toggle');

  function positionPanel() {
    const r = toggle.getBoundingClientRect();
    // If your .menu-panel is position:fixed, drop the +window.scrollY
    panel.style.right = `${Math.max(16, window.innerWidth - r.right)}px`;
    panel.style.top   = `${r.bottom + 8 + window.scrollY}px`;
  }

  function open() {
    positionPanel();
    panel.classList.add('in');
    toggle.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', onDocClick, { passive: true });
    window.addEventListener('resize', onReflow, { passive: true });
    window.addEventListener('scroll', onReflow, { passive: true });
  }
  function close() {
    panel.classList.remove('in');
    toggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClick);
    window.removeEventListener('resize', onReflow);
    window.removeEventListener('scroll', onReflow);
  }
  function onDocClick(e) {
    if (e.target === toggle || toggle.contains(e.target)) return;
    if (!panel.contains(e.target)) close();
  }
  function onReflow(){ if (panel.classList.contains('in')) positionPanel(); }

  toggle.onclick = (e) => {
    e.stopPropagation();
    panel.classList.contains('in') ? close() : open();
  };
}

/* Public helper so other pages can refresh the badge after auth changes */
export function refreshAuthBadge() {
  const a = document.getElementById('auth-status');
  if (!a) return;
  let user = null;
  try { user = currentUser(); } catch {}
  if (user) {
    a.textContent = `Logged in as ${user}`;
    a.title = `Logged in as ${user}`;
  } else {
    a.textContent = 'Login';
    a.title = 'Login';
  }
  a.href = './profile.html';
}

// Update the badge if auth changes (same tab or other tab)
window.addEventListener('auth:changed', refreshAuthBadge);
window.addEventListener('storage', (e) => {
  if (e.key === 'auth.user') refreshAuthBadge();
});


/* ---------- Filters bar ---------- */
export function renderFilters({ state }, onChange) {
  const el = document.getElementById('filters');
  if (!el) return;

  el.innerHTML = `
    <div class="multiselect" id="state-select"></div>
    <div class="chipbar" id="type-chips"></div>
    <input id="search" type="search" placeholder="Search name or city…" />
    <select id="sort">
      <option value="name_asc">Sort: Name A–Z</option>
      <option value="size_desc">Sort: Size (desc)</option>
    </select>
  `;

  // States dropdown
  buildStatesDropdown({
    mountId: 'state-select',
    selected: state.filters.states,
    options: APP.states,
    onApply: (nextSet) => {
      state.filters.states = nextSet;
      onChange();
    }
  });

  // Type chips
  const tc = document.getElementById('type-chips');
  APP.assetTypes.forEach(t => {
    const b = document.createElement('button');
    b.className = 'chip' + (state.filters.types.has(t) ? ' active' : '');
    b.textContent = label(t);
    b.dataset.value = t;
    b.dataset.kind = 'type';
    b.dataset.type = t; // allows CSS dot color
    b.onclick = () => { toggleChip(state.filters.types, t); onChange(); };
    tc.appendChild(b);
  });

  // Search + sort
  const search = document.getElementById('search');
  search.value = state.filters.search;
  search.oninput = () => { state.filters.search = search.value; onChange(); };

  const sort = document.getElementById('sort');
  sort.value = state.filters.sortBy;
  sort.onchange = () => { state.filters.sortBy = sort.value; onChange(); };
}

/* ---------- Cards ---------- */
export function renderCards(sites, container = document.getElementById('cards'), onBookmarkToggle) {
  container.innerHTML = '';

  sites.forEach(site => {
    const card = document.createElement('article');
    card.className = 'card';
    card.id = `card-${site.id}`;
    const saved = isBookmarked(site.id);

    card.innerHTML = `
      <h3>
        <span class="type-dot" data-type="${site.asset_type}"></span>${site.name}
      </h3>
      <div class="meta">${site.city || ''}${site.city ? ', ' : ''}${site.state} • ${label(site.asset_type)}</div>
      <div class="meta">${fmtSize(site)}${site.clear_height_ft ? ` • Clear ${site.clear_height_ft}′` : ''}</div>
      <div class="tags">
        ${site.rail_distance_km!=null ? `<span class="tag">Rail ${site.rail_distance_km} km</span>`:''}
        ${site.highway_distance_km!=null ? `<span class="tag">Highway ${site.highway_distance_km} km</span>`:''}
        ${flag(site.power_nearby,'Power nearby')}
        ${flag(site.water_wastewater_nearby,'Water/Wastewater')}
      </div>
      <div class="actions">
        <a class="btn ghost" href="${site.source_url || '#'}" target="_blank" rel="noreferrer">Source</a>
        <button class="btn bookmark ${saved ? 'is-on' : ''}" data-bookmark
                aria-pressed="${saved ? 'true' : 'false'}">
          ${saved ? 'Remove Bookmark' : 'Bookmark'}
        </button>
      </div>
    `;

    const bm = card.querySelector('[data-bookmark]');
    if (bm) {
      bm.onclick = () => {
        const nowSaved = toggleBookmark(site.id);
        if (onBookmarkToggle) onBookmarkToggle(site.id, nowSaved);
        renderBookmarkButton(card, nowSaved);
      };
    }

    container.appendChild(card);
  });
}

function renderBookmarkButton(card, saved){
  const btn = card.querySelector('[data-bookmark]');
  if (!btn) return;
  btn.classList.toggle('is-on', saved);
  btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
  btn.textContent = saved ? 'Remove Bookmark' : 'Bookmark';
}

/* ---------- Results meta ---------- */
export function setResultsCount(n) {
  const el = document.getElementById('results-count');
  if (el) el.textContent = `${n} result${n===1?'':'s'}`;
}
export function highlightCard(siteId) {
  const el = document.getElementById(`card-${siteId}`);
  if (!el) return;
  el.classList.add('highlight');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => el.classList.remove('highlight'), 1200);
}

/* ---------- States multiselect dropdown ---------- */
function buildStatesDropdown({ mountId, selected, options, onApply }) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  // Trigger button
  const btn = document.createElement('button');
  btn.className = 'select-btn';
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');

  const labelSpan = document.createElement('span');
  labelSpan.textContent = 'States';

  const countSpan = document.createElement('span');
  countSpan.className = 'count';
  countSpan.textContent = `(${selected.size} selected)`;

  const caret = document.createElement('span');
  caret.textContent = '▾';

  btn.append(labelSpan, countSpan, caret);

  // Popover menu
  const menu = document.createElement('div');
  menu.className = 'select-menu';
  menu.hidden = true;

  const list = document.createElement('ul');
  list.className = 'select-list';

  // Temp copy; only commit on OK
  const temp = new Set(Array.from(selected));

  function renderList() {
    list.innerHTML = '';
    options.forEach(st => {
      const li = document.createElement('li');
      li.className = 'select-item';
      li.dataset.value = st;

      const check = document.createElement('span');
      check.className = 'check';
      check.textContent = temp.has(st) ? '✓' : '';

      const text = document.createElement('span');
      text.className = 'label';
      text.textContent = st;

      li.append(check, text);
      li.onclick = () => {
        if (temp.has(st)) temp.delete(st); else temp.add(st);
        check.textContent = temp.has(st) ? '✓' : '';
      };

      list.appendChild(li);
    });
  }
  renderList();

  const actions = document.createElement('div');
  actions.className = 'select-actions';

  const ok = document.createElement('button');
  ok.className = 'btn primary';
  ok.textContent = 'OK';

  const cancel = document.createElement('button');
  cancel.className = 'btn';
  cancel.textContent = 'Cancel';

  actions.append(ok, cancel);
  menu.append(list, actions);

  mount.append(btn, menu);

  // Bulk actions below (outside menu): Clear all / Select all
  const bulk = document.createElement('div');
  bulk.className = 'select-bulk';
  bulk.innerHTML = `
    <button type="button" class="btn" data-bulk="clear">Clear all</button>
    <button type="button" class="btn" data-bulk="select">Select all</button>
  `;
  mount.appendChild(bulk);

  // CLEAR ALL
  bulk.querySelector('[data-bulk="clear"]').onclick = (e) => {
    e.preventDefault();
    selected.clear();
    temp.clear();
    countSpan.textContent = `(0 selected)`;
    renderList();
    onApply(selected);
  };

  // SELECT ALL
  bulk.querySelector('[data-bulk="select"]').onclick = (e) => {
    e.preventDefault();
    selected.clear();
    options.forEach(v => selected.add(v));
    temp.clear();
    options.forEach(v => temp.add(v));
    countSpan.textContent = `(${selected.size} selected)`;
    renderList();
    onApply(selected);
  };

  // Open/close behavior
  function openMenu() {
    temp.clear(); selected.forEach(v => temp.add(v));
    renderList();
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
  }
  function closeMenu() {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onKey);
  }
  function onDocClick(e) {
    if (!menu.hidden && !mount.contains(e.target)) closeMenu();
  }
  function onKey(e) {
    if (e.key === 'Escape') closeMenu();
  }

  btn.onclick = () => (menu.hidden ? openMenu() : closeMenu());

  ok.onclick = () => {
    const next = new Set(Array.from(temp));
    onApply(next);
    countSpan.textContent = `(${next.size} selected)`;
    closeMenu();
  };
  cancel.onclick = () => closeMenu();
}

/* ---------- helpers ---------- */
function toggleChip(set, value) {
  set.has(value) ? set.delete(value) : set.add(value);
  const buttons = document.querySelectorAll('.chip');
  buttons.forEach(b => {
    if (b.dataset && b.dataset.value === value) {
      b.classList.toggle('active');
    }
  });
}
function label(t) {
  return (
    {
      industrial_building: 'Industrial Building',
      industrial_shell: 'Industrial Shell',
      industrial_land: 'Industrial Land'
    }[t] || t
  );
}
function fmtSize(s) {
  return s.size_sqft
    ? `${Number(s.size_sqft).toLocaleString()} sq ft`
    : (s.acreage ? `${s.acreage} acres` : 'Size n/a');
}
function flag(v, text) {
  return v ? `<span class="tag">${text}</span>` : '';
}
