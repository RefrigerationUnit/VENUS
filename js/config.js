export const APP = {
  name: 'Colossus Maps',
  states: [
    'AL','AZ','AR','CA','CO','CT','DE','FL','GA','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI',
    'MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
    'TX','UT','VT','VA','WA','WV','WI','WY'
  ],
  assetTypes: ['industrial_building','industrial_shell','industrial_land'],
  assetLabels: { industrial_building:'Industrial Building', industrial_shell:'Industrial Shell', industrial_land:'Industrial Land' },
  mapDefaults: { lat: 39.5, lon: -98.35, zoom: 4 } // CONUS
};

