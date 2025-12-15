// /js/map.js
import { APP, TYPE_COLORS } from './config.js';

let gmap = null;
let gmarkers = [];       // [{obj, advanced}]
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

const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1f2937" }]},
  { elementType: "labels.text.stroke", stylers: [{ color: "#1f2937" }]},
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }]},
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d1d5db" }]},
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#a3a3a3" }]},
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0b3a2b" }]},
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#86efac" }]},
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#374151" }]},
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111827" }]},
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#d1d5db" }]},
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1f2937" }]},
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] }
];

// Public: register a callback to run once the map is ready.
export function onMapReady(cb) {
  if (gmap) cb(gmap); else readyCallbacks.push(cb);
}

// Public: (re)draw markers from a site list
export function refreshMarkers(sites, onMarkerClick) {
  if (!gmap) return;

  // Clear existing
  gmarkers.forEach(({ obj, advanced }) => {
    if (advanced) obj.map = null; else obj.setMap(null);
  });
  gmarkers = [];

  const bounds = new google.maps.LatLngBounds();
  const iw = new google.maps.InfoWindow();
  const Advanced = google.maps.marker && google.maps.marker.AdvancedMarkerElement;

  sites.forEach(s => {
    const col = colorFor(s.asset_type);

    if (Advanced) {
      // DOM-based dot with glow (needs .gm-dot CSS in your stylesheet)
      const dot = document.createElement('div');
      dot.className = 'gm-dot';
      // Base color + glow
      dot.style.background = col;
      dot.style.boxShadow = `0 0 8px ${col}, 0 0 18px ${hexToRgba(col, 0.35)}`;

      const m = new Advanced({
        map: gmap,
        position: { lat: s.lat, lng: s.lon },
        content: dot
      });

      m.addListener('click', () => {
        iw.setContent(`
          <div style="color:#e6e6ea">
            <strong>${s.name}</strong><br/>
            <span style="color:#a1a1aa">${s.city || ''}${s.city ? ', ' : ''}${s.state}</span>
          </div>
        `);
        // InfoWindow with AdvancedMarkerElement anchor syntax
        iw.open({ map: gmap, anchor: m });
        onMarkerClick && onMarkerClick(s.id);
      });

      gmarkers.push({ obj: m, advanced: true });
    } else {
      // Fallback classic marker (no CSS glow available here)
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
        iw.setContent(`
          <div style="color:#e6e6ea">
            <strong>${s.name}</strong><br/>
            <span style="color:#a1a1aa">${s.city || ''}${s.city ? ', ' : ''}${s.state}</span>
          </div>
        `);
        iw.open(gmap, m);
        onMarkerClick && onMarkerClick(s.id);
      });

      gmarkers.push({ obj: m, advanced: false });
    }

    bounds.extend(new google.maps.LatLng(s.lat, s.lon));
  });

  if (!bounds.isEmpty()) gmap.fitBounds(bounds);
}

// Google’s callback must be global, so attach it to window.
// This will be invoked by the script tag in index.html.
window.initMap = function initMap() {
  const el = document.getElementById('map');
  if (!el) return;

  gmap = new google.maps.Map(el, {
    center: { lat: APP.mapDefaults.lat, lng: APP.mapDefaults.lon },
    zoom: APP.mapDefaults.zoom,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    styles: DARK_STYLE,
    backgroundColor: '#0b0b0e'
  });

  // Flush any queued callbacks
  while (readyCallbacks.length) {
    const cb = readyCallbacks.shift();
    try { cb(gmap); } catch (e) { console.error(e); }
  }
};
