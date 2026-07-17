
// NYC Open Data Socrata API from the Express backend.
//
// Dataset: Street Closures due to Construction Activities
// Docs:    https://data.cityofnewyork.us/resource/ezy6-djsf.json
 
 
const NYC_API = 'https://data.cityofnewyork.us/resource/ezy6-djsf.json';

export async function nycFetch(params = {}) {
  const url = new URL(NYC_API);

  url.searchParams.set('$limit', params.$limit || 50);
  if (params.$where)  url.searchParams.set('$where',  params.$where);
  if (params.$order)  url.searchParams.set('$order',  params.$order);
  if (params.$select) url.searchParams.set('$select', params.$select);
  if (params.$offset) url.searchParams.set('$offset', params.$offset);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`NYC API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}