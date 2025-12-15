import { APP } from './config.js';
import { isBookmarked, toggleBookmark } from './storage.js';

export function buildHeader(active = 'home') {
  const el = document.getElementById('app-header');
  el.innerHTML = `
    <div class="brand">${APP.name}</div>
    <nav>
      <a href="./index.html" class="${active==='home'?'active':''}">Home</a>
      <a href="./contacts.html" class="${active==='contacts'?'active':''}">Contacts</a>
      <a href="./profile.html" class="${active==='profile'?'active':''}">Profile</a>
    </nav>
  `;
}

export function renderFilters({ state }, onChange) {
  const el = document.getElementById('filters');
  el.innerHTML = `
    <div class="chipbar" id="state-chips"></div>
    <div class="chipbar" id="type-chips"></div>
    <input id="search" type="search" placeholder="Search name or city…" />
    <select id="sort">
      <option value="name_asc">Sort: Name A–Z</option>
      <option value="size_desc">Sort: Size (desc)</option>
    </select>
  `;

  // State chips (dynamic)
  const sc = document.getElementById('state-chips');
  APP.states.forEach(st => {
    const b = document.createElement('button');
    b.className = 'chip' + (state.filters.states.has(st) ? ' active' : '');
    b.textContent = st;
    b.dataset.value = st;
    b.dataset.kind = 'state';
    b.onclick = () => { toggleChip(state.filters.states, st); onChange(); };
    sc.appendChild(b);
  });

  // Type chips (dynamic)
  const tc = document.getElementById('type-chips');
  APP.assetTypes.forEach(t => {
    const b = document.createElement('button');
    b.className = 'chip' + (state.filters.types.has(t) ? ' active' : '');
    b.textContent = label(t);
    b.dataset.value = t;
    b.dataset.kind = 'type';
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

export function renderCards(sites, container = document.getElementById('cards'), onBookmarkToggle) {
  container.innerHTML = '';
  sites.forEach(site => {
    const card = document.createElement('article');
    card.className = 'card';
    card.id = `card-${site.id}`;
    const saved = isBookmarked(site.id);
    card.innerHTML = `
      <h3>${site.name}</h3>
      <div class="meta">${site.city || ''}${site.city?', ':''}${site.state} • ${label(site.asset_type)}</div>
      <div class="meta">${fmtSize(site)}${site.clear_height_ft ? ` • Clear ${site.clear_height_ft}′` : ''}</div>
      <div class="tags">
        ${site.rail_distance_km!=null ? `<span class="tag">Rail ${site.rail_distance_km} km</span>`:''}
        ${site.highway_distance_km!=null ? `<span class="tag">Highway ${site.highway_distance_km} km</span>`:''}
        ${flag(site.power_nearby,'Power nearby')}
        ${flag(site.water_wastewater_nearby,'Water/Wastewater')}
      </div>
      <div class="actions">
        <a class="btn ghost" href="${site.source_url || '#'}" target="_blank" rel="noreferrer">Source</a>
        <button class="btn ${saved?'danger':'primary'}" data-bookmark>
          ${saved ? 'Remove Bookmark' : 'Bookmark'}
        </button>
      </div>
    `;
    card.querySelector('[data-bookmark]').onclick = () => {
      const nowSaved = toggleBookmark(site.id);
      if (onBookmarkToggle) onBookmarkToggle(site.id, nowSaved);
      renderBookmarkButton(card, nowSaved);
    };
    container.appendChild(card);
  });
}

export function setResultsCount(n) {
  document.getElementById('results-count').textContent = `${n} result${n===1?'':'s'}`;
}

export function highlightCard(siteId) {
  const el = document.getElementById(`card-${siteId}`);
  if (!el) return;
  el.classList.add('highlight');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => el.classList.remove('highlight'), 1200);
}

/* helpers */
function toggleChip(set, value) {
  set.has(value) ? set.delete(value) : set.add(value);
  // Update button state in-place
  const buttons = document.querySelectorAll('.chip');
  buttons.forEach(b => {
    if (b.textContent === value || b.textContent === label(value)) {
      b.classList.toggle('active');
    }
  });
}
function label(t){ return ({industrial_building:'Industrial Building', industrial_shell:'Industrial Shell', industrial_land:'Industrial Land'})[t] || t; }
function fmtSize(s){ return s.size_sqft ? `${Number(s.size_sqft).toLocaleString()} sq ft` : (s.acreage ? `${s.acreage} acres` : 'Size n/a'); }
function flag(v, text){ return v ? `<span class="tag">${text}</span>` : ''; }

function renderBookmarkButton(card, saved){
  const btn = card.querySelector('[data-bookmark]');
  btn.className = `btn ${saved?'danger':'primary'}`;
  btn.textContent = saved ? 'Remove Bookmark' : 'Bookmark';
}
