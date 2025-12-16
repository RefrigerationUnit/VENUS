export const APP = {
  name: 'VENUS PROJECT',

  states: [
    'AL','AZ','AR','CA','CO','CT','DE','FL','GA','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI',
    'MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
    'TX','UT','VT','VA','WA','WV','WI','WY'
  ],

  assetTypes: ['industrial_building','industrial_shell','industrial_land'],
  assetLabels: {
    industrial_building: 'Industrial Building',
    industrial_shell: 'Industrial Shell',
    industrial_land: 'Industrial Land'
  },

  // Map defaults (CONUS center)
  mapDefaults: { lat: 39.5, lon: -98.35, zoom: 4 },

  // Your Map ID (JavaScript, Vector). Needed for AdvancedMarkerElement.
  mapId: '68364d0a0f2234a582fa05da',

  // Leave true; code will fall back automatically if conditions aren’t met.
  useAdvancedMarkers: true
};

// Type colors used across UI + markers
export const TYPE_COLORS = {
  industrial_building: '#6ee7b7', // green
  industrial_shell:    '#60A5FA', // blue
  industrial_land:     '#F59E0B'  // orange
};
