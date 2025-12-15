import { APP, TYPE_COLORS } from './config.js';

let gmap = null;
let gmarkers = [];
const readyCallbacks = [];

function colorFor(type) {
  return TYPE_COLORS[type] || '#9CA3AF';
}
function hexToRgba(hex, a = 0.45) {
  const s = hex.replace('#','');
  const n = parseInt(s.length === 3 ? s.split('').map(x => x + x).join('') : s, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

// Local dark style (used only when no Map ID is provided)
const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1f2937" }]},
  { elementType: "labels.text.stroke", stylers: [{ color: "#1f2937" }]},
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }]},
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#374151" }]},
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111827" }]},
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }]},
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0b3a2b" }]}
];

// Public: register a callback to run once the map is ready
export function onMapReady(cb) {
  if (gmap) cb(gmap); else readyCallbacks.push(cb);
}

// Can we use AdvancedMarkerElement?
function canUseAdvanced() {
  return !!(
    APP.useAdvancedMarkers &&
    APP.mapId &&                                    // requires vector map with Map ID
    google.maps.marker &&
    google.maps.marker.AdvancedMarkerElement
  );
}

// Public: draw markers
export function refreshMarkers(sites, onMarkerClick) {
  if (!gmap) return;

  // Clear existing markers
  gmarkers.forEach(m => {
    if (m instanceof google.maps.Marker) m.setMap(null);
    else if (m && 'map' in m) m.map = null; // AdvancedMarkerElement
  });
  gmarkers = [];

  if (!sites || sites.length === 0) return;

  const bounds = new google.maps.LatLngBounds();
  const iw = new google.maps.InfoWindow();
  const useAdvanced = canUseAdvanced();

  sites.forEach(s => {
    const col = colorFor(s.asset_type);

    if (useAdvanced) {
      // DOM dot with glow
      const dot = document.createElement('div');
      dot.className = 'gm-dot'; // make sure .gm-dot exists in styles.css
      dot.style.background = col;
      dot.style.boxShadow = `0 0 8px ${col}, 0 0 18px ${hexToRgba(col, 0.35)}`;

      const m = new google.maps.marker.AdvancedMarkerElement({
        map: gmap,
        position: { lat: s.lat, lng: s.lon },
        content: dot
      });

      m.addListener('click', () => {
        iw.setContent(
          `<div style="color:#e6e6ea"><strong>${s.name}</strong><br/><span style="color:#a1a1aa">${s.city||''}${s.city?', ':''}${s.state}</span></div>`
        );
        iw.open({ map: gmap, anchor: m });
        onMarkerClick && onMarkerClick(s.id);
      });

      gmarkers.push(m);
    } else {
      // Classic vector symbol (no DOM glow)
      const m = new google.maps.Marker({
        position: { lat: s.lat, lng: s.lon },
        map: gmap,
        title: s.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6.5,
          fillColor: col,
          fillOpacity: 1,
          strokeColor: '#111827',
          strokeWeight: 1
        }
      });

      m.addListener('click', () => {
        iw.setContent(
          `<div style="color:#e6e6ea"><strong>${s.name}</strong><br/><span style="color:#a1a1aa">${s.city||''}${s.city?', ':''}${s.state}</span></div>`
        );
        iw.open(gmap, m);
        onMarkerClick && onMarkerClick(s.id);
      });

      gmarkers.push(m);
    }

    bounds.extend(new google.maps.LatLng(s.lat, s.lon));
  });

  if (!bounds.isEmpty()) gmap.fitBounds(bounds);
}

// Define and expose the global initMap callback used by the script tag
function initMap() {
  const el = document.getElementById('map');
  if (!el) return;

  const opts = {
    center: { lat: APP.mapDefaults.lat, lng: APP.mapDefaults.lon },
    zoom: APP.mapDefaults.zoom,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    backgroundColor: '#0b0b0e',
    ...(APP.mapId ? { mapId: APP.mapId } : { styles: DARK_STYLE })
  };

  gmap = new google.maps.Map(el, opts);

  // Flush queued callbacks
  while (readyCallbacks.length) {
    try { readyCallbacks.shift()(gmap); } catch (e) { console.error(e); }
  }
}
window.initMap = initMap;
