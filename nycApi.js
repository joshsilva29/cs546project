

 // Shared helpers for querying NYC Open Data (Socrata).
//
// TWO datasets are used by this project:
//
//   ezy6-djsf — "by Block and Intersection"
//               478k rows, full history back to 1991.
//               NO usable coordinates (wkt is text, NY State Plane).
//               Used by: /closureDuration, /closureHistory, /closureSearch
//
//   478a-yykk — "by Intersection"
//               ~1.8k rows, CURRENT closures only, updated weekly.
//               HAS a real `the_geom` point column (WGS84 lat/lon),
//               so SoQL within_circle() works on it.
//               Used by: /closureNearYou
 
const HISTORY_API = 'https://data.cityofnewyork.us/resource/ezy6-djsf.json';
const GEO_API     = 'https://data.cityofnewyork.us/resource/478a-yykk.json';

async function fetchFrom(baseUrl, params = {}) {
  const url = new URL(baseUrl);

  url.searchParams.set('$limit', params.$limit || 50);
  if (params.$where)  url.searchParams.set('$where',  params.$where);
  if (params.$order)  url.searchParams.set('$order',  params.$order);
  if (params.$select) url.searchParams.set('$select', params.$select);
  if (params.$offset) url.searchParams.set('$offset', params.$offset);

  // console.log(url.toString());
  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`NYC API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Query the full-history dataset (ezy6-djsf)
export async function nycFetch(params = {}) {
  return fetchFrom(HISTORY_API, params);
}

// Query the geo-enabled current-closures dataset (478a-yykk)
export async function nycGeoFetch(params = {}) {
  return fetchFrom(GEO_API, params);
}

// Borough code → full name (geo dataset uses single letters)
export const BOROUGH_NAMES = {
  M: 'MANHATTAN',
  X: 'BRONX',
  B: 'BROOKLYN',
  Q: 'QUEENS',
  S: 'STATEN ISLAND',
};

// Full name → borough code, for filtering the geo dataset
export const BOROUGH_CODES = {
  MANHATTAN:       'M',
  BRONX:           'X',
  BROOKLYN:        'B',
  QUEENS:          'Q',
  'STATEN ISLAND': 'S',
};