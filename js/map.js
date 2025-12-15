import { APP } from './config.js';

let gmap = null;
let gmarkers = [];
const callbacks = [];

// Expose a hook for others to run when the map is ready
export function onMapReady(cb){ if (gmap) cb(gmap); else callbacks.push(cb); }

export function refreshMarkers(sites, onMarkerClick) {
  if (!gmap) return;
  gmarkers.forEach(m => m.setMap(null));
  gmarkers = [];

  const bounds = new google.maps.LatLngBounds();
  const iw = new google.maps.InfoWindow();

  sites.forEach(s => {
    const marker = new google.maps.Marker({
      position: { lat: s.lat, lng: s.lon },
      map: gmap,
      title: s.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: '#6ee7b7',
        fillOpacity: 1,
        strokeColor: '#1f2937',
        strokeWeight: 1
      }
    });
    marker.addListener('click', () => {
      iw.setContent(`<div style="color:#e6e6ea"><strong>${s.name}</strong><br/><span style="color:#a1a1aa">${s.city||''}${s.city?', ':''}${s.state}</span></div>`);
      iw.open(gmap, marker);
      onMarkerClick && onMarkerClick(s.id);
    });
    gmarkers.push(marker);
    bounds.extend(marker.getPosition());
  });

  if (!bounds.isEmpty()) gmap.fitBounds(bounds);
}

const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1f2937" }]},
  { elementType: "labels.text.stroke", stylers: [{ color: "#1f2937" }]},
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }]},
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#374151" }]},
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111827" }]},
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }]},
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0b3a2b" }]}
];

// Google callback must be global:
window.initMap = function initMap(){
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
  while (callbacks.length) callbacks.shift()(gmap);
};
