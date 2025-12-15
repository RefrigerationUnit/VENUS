import { buildHeader, renderFilters, renderCards, setResultsCount, highlightCard } from './ui.js';
import { loadSites } from './dataloader.js';
import { defaultFilter, applyFilters } from './filters.js';
import { onMapReady, refreshMarkers } from './map.js';

const state = {
  sites: [],
  filters: defaultFilter()
};

buildHeader('home');

function render() {
  const visible = applyFilters(state.sites, state.filters);
  setResultsCount(visible.length);
  renderCards(visible, document.getElementById('cards'), onBookmarkToggle);
  refreshMarkers(visible, (id) => highlightCard(id));
}

function onBookmarkToggle() {
  // No special action on index; button text changes locally in ui.js
}

renderFilters({ state }, () => render());

(async function init() {
  state.sites = await loadSites();
  onMapReady(() => render());  // waits for Google map before drawing markers
  render();                    // render list immediately (map updates once ready)
})();
