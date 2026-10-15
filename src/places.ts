// Every place I've visited, for /resources/places: just where, nothing else.
// Add a country with its ISO codes, then its places: the region is the state/province ISO 3166-2 code (e.g. 'MX-PUE', 'CA-QC'; see src/data/admin1.topo.json
// or en.wikipedia.org/wiki/ISO_3166-2), and lat/lon put the pin on the map.
//
// TODO(Emilio): add the rest.

export type Place = { name: string; region: string; lat: number; lon: number };
// a3: ISO 3166-1 alpha-3; num: ISO 3166-1 numeric (how the world map names countries).
export type Country = { name: string; a3: string; num: string; places: Place[] };

export const COUNTRIES: Country[] = [
  {
    name: 'Mexico', a3: 'MEX', num: '484',
    places: [
      { name: 'Villahermosa', region: 'MX-TAB', lat: 17.99, lon: -92.93 },
      { name: 'Puebla', region: 'MX-PUE', lat: 19.04, lon: -98.21 },
      { name: 'Mexico City', region: 'MX-DIF', lat: 19.43, lon: -99.13 },
      { name: 'Monterrey', region: 'MX-NLE', lat: 25.69, lon: -100.32 },
      { name: 'Huatulco', region: 'MX-OAX', lat: 15.77, lon: -96.13 },
      { name: 'Campeche', region: 'MX-CAM', lat: 19.85, lon: -90.53 },
      { name: 'Mérida', region: 'MX-YUC', lat: 20.97, lon: -89.62 },
      { name: 'Cancún', region: 'MX-ROO', lat: 21.16, lon: -86.85 },
      { name: 'Isla Mujeres', region: 'MX-ROO', lat: 21.23, lon: -86.73 },
      { name: 'Holbox', region: 'MX-ROO', lat: 21.52, lon: -87.38 },
      { name: 'Playa del Carmen', region: 'MX-ROO', lat: 20.63, lon: -87.08 },
      { name: 'Mahahual', region: 'MX-ROO', lat: 18.71, lon: -87.71 },
      { name: 'Chetumal', region: 'MX-ROO', lat: 18.5, lon: -88.3 },
      { name: 'Veracruz', region: 'MX-VER', lat: 19.17, lon: -96.13 },
      { name: 'Coatzacoalcos', region: 'MX-VER', lat: 18.15, lon: -94.43 },
    ],
  },
  {
    name: 'Canada', a3: 'CAN', num: '124',
    places: [
      { name: 'Montreal', region: 'CA-QC', lat: 45.5, lon: -73.57 },
      { name: 'Quebec City', region: 'CA-QC', lat: 46.81, lon: -71.21 },
      { name: 'Ottawa', region: 'CA-ON', lat: 45.42, lon: -75.7 },
      { name: 'Toronto', region: 'CA-ON', lat: 43.65, lon: -79.38 },
      { name: 'Niagara Falls', region: 'CA-ON', lat: 43.09, lon: -79.08 },
    ],
  },
  {
    name: 'United States', a3: 'USA', num: '840',
    places: [
      { name: 'Las Vegas', region: 'US-NV', lat: 36.17, lon: -115.14 },
      { name: 'Phoenix', region: 'US-AZ', lat: 33.45, lon: -112.07 },
      { name: 'Chicago', region: 'US-IL', lat: 41.88, lon: -87.63 },
      { name: 'New York', region: 'US-NY', lat: 40.71, lon: -74.01 },
      { name: 'San Antonio', region: 'US-TX', lat: 29.42, lon: -98.49 },
      { name: 'Houston', region: 'US-TX', lat: 29.76, lon: -95.37 },
      { name: 'Dallas', region: 'US-TX', lat: 32.78, lon: -96.8 },
    ],
  },
];
