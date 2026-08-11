import { Router } from 'express';
import { nycGeoFetch, BOROUGH_NAMES, BOROUGH_CODES } from '../nycApi.js';
 
const router = Router();
 
 
// Helper: calculate duration in days between two date strings

function calcDuration(start, end) {
  if (!start || !end) return null;
  return Math.round((new Date(end) - new Date(start)) / 86400000);
}
 

// Helper: determine closure status from its dates

// Calculate duration in days between two date strings.
// Returns null if either date is missing.

function calcStatus(start, end) {
  if (!end) return 'unknown';
  const now      = new Date();
  const endDate  = new Date(end);
  const startDate = start ? new Date(start) : null;
 
  if (endDate < now)                       return 'completed';
  if (startDate && startDate > now)        return 'upcoming';
  return 'active';
}

// Straight-line distance between two lat/lon points in miles
function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the Earth in miles
  const toRad = d => (d*Math.PI)/180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Helper: escape single quotes for SoQL queries
const soqlEscape = s => s.replace(/'/g, "''");


// Helper: remove duplicate rows returned from NYC API (by uniqueid)
//dedupes on uniqueid, NOT nodeid, - one intersection can legitimately have multiple closures, but each closure should be unique.
function dedupe(rows) {
  const seen = new Set();
  return rows.filter(row => {
    if (!row.uniqueid || seen.has(row.uniqueid)) return false;
    seen.add(row.uniqueid);
    return true;
  });
}

// Shape a raw API row into our response format.
// originLat/originLon are optional — when provided, distance is calculated.
function formatRow(row, originLat = null, originLon = null) {
  const coords = row.the_geom?.coordinates || [];
  const rowLon = coords[0] ?? null;   // GeoJSON is [lon, lat]
  const rowLat = coords[1] ?? null;
 
  const hasCoords = rowLat !== null && rowLon !== null;
  const canMeasure = hasCoords && originLat !== null && originLon !== null;
 
  return {
    street:       row.onstreetname   || null,
    crossStreet:  row.fromstreetname || null,
    borough:      BOROUGH_NAMES[row.borough_code] || row.borough_code || null,
    workType:     row.purpose         || null,
    startDate:    row.work_start_date || null,
    endDate:      row.work_end_date   || null,
    durationDays: calcDuration(row.work_start_date, row.work_end_date),
    status:       calcStatus(row.work_start_date, row.work_end_date),
    distanceMiles: canMeasure
      ? parseFloat(distanceMiles(originLat, originLon, rowLat, rowLon).toFixed(2))
      : null,
    coordinates: { lat: rowLat, lon: rowLon },
  };
}

// Validate an optional borough parameter 
// Returns {code} on success, or {error} if the name is unknown.
function resolveBorough(borough) {
  if (!borough) return {code: null};
  const code = BOROUGH_CODES[borough.toUpperCase()];
  if (!code) {
    return{
      error: {
        error: `Unknown borough: ${borough}`,
        validBoroughs: Object.keys(BOROUGH_CODES)
      }
    };
  }
  return {code};

      }
   
// GET /closureNearYou
//
// Finds CURRENT street closures near a location. Both modes query the
// 478a-yykk "by Intersection" dataset, which has a real `the_geom` point
// column — so every result carries coordinates and can be mapped.
//
// NOTE: current closures only (~1,800 rows, refreshed weekly).
// For past closures use /closureHistory, which reads ezy6-djsf.

router.get('/closureNearYou', async (req, res) => {
  const { lat, lon, miles, street, borough } = req.query;

  const boroughResult = resolveBorough(borough);
  if (boroughResult.error) return res.status(400).json(boroughResult.error);
  const boroughCode = boroughResult.code;
 

   // MODE 1 — COORDINATE SEARCH (SoQL within_circle)
  //   /closureNearYou?lat=40.7128&lon=-74.0060
  //   /closureNearYou?lat=40.7128&lon=-74.0060&miles=2
  if (lat && lon) {
    const latitude  = parseFloat(lat);
    const longitude = parseFloat(lon);
 
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: '"lat" and "lon" must be valid numbers' });
    }
 
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Coordinates are out of valid range' });
    }

    let searchMiles = parseFloat(miles) || 1;
    if (isNaN(searchMiles) || searchMiles <= 0) searchMiles = 1;
    searchMiles = Math.min(searchMiles, 10); // cap at 10 miles

    const radiusMeters = Math.round(searchMiles * 1609.34); // miles → meters

    const where =[
      `within_circle(the_geom, ${latitude}, ${longitude}, ${radiusMeters})`
    ];
    if (boroughCode) where.push(`borough_code='${boroughCode}'`);

    try {
      const data = await nycGeoFetch({
        $limit: 200,
        $where: where.join(' AND '),
      });

      const rows = dedupe(data);

       if (!rows.length) {
        return res.status(404).json({
          message:  `No current closures found within ${searchMiles} mile(s) of your location.`,
          location: { lat: latitude, lon: longitude },
          radius:   `${searchMiles} mile(s)`,
        });
      }

       const results = rows.map(row => formatRow(row, latitude, longitude));
 
      // within_circle filters but does not sort — order closest first
      results.sort((a, b) => (a.distanceMiles ?? 999) - (b.distanceMiles ?? 999));
 
      return res.status(200).json({
        searchMode: 'coordinates',
        count:      results.length,
        location:   { lat: latitude, lon: longitude },
        radius:     `${searchMiles} mile(s)`,
        borough:    borough ? borough.toUpperCase() : 'all',
        results:    results.slice(0, 50),
      });
 
    } catch (err) {
      console.error('[/closureNearYou] NYC API error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch nearby closures from NYC API' });
    }
  }
 
  
 // MODE 2 — STREET SEARCH (matches on-street and cross-street)
  //   /closureNearYou?street=BROADWAY
  //   /closureNearYou?street=BROADWAY&borough=Manhattan
  
   if (street) {
    const cleanStreet = soqlEscape(street.toUpperCase());
 
    // Match the street as the closure's on-street OR as its cross-street,
    // so "near BROADWAY" includes closures on intersecting blocks.
    const nameMatch =
      `(upper(onstreetname) like '%${cleanStreet}%' ` +
      `OR upper(fromstreetname) like '%${cleanStreet}%')`;
 
    const where = [nameMatch];
    if (boroughCode) where.push(`borough_code='${boroughCode}'`);
 
    try {
      const data = await nycGeoFetch({
        $limit: 200,
        $order: 'work_start_date DESC',
        $where: where.join(' AND '),
      });
 
      const rows = dedupe(data);
 
      if (!rows.length) {
        return res.status(404).json({
          message: `No current closures found near: ${street}`,
          hint:    'This route covers current closures only. Try /closureHistory for past closures.',
        });
      }
 
      // No origin point in this mode, so distanceMiles stays null.
      const results = rows.map(row => formatRow(row));
 
      return res.status(200).json({
        searchMode: 'street',
        count:      results.length,
        street:     street.toUpperCase(),
        borough:    borough ? borough.toUpperCase() : 'all',
        results:    results.slice(0, 50),
      });
 
    } catch (err) {
      console.error('[/closureNearYou] NYC API error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch nearby closures from NYC API' });
    }
  }
 
  
  // NEITHER MODE — missing required params
  
  return res.status(400).json({
    error: 'Provide either "lat" and "lon" for coordinate search, or "street" for street name search',
    examples: [
      '/closureNearYou?lat=40.7128&lon=-74.0060',
      '/closureNearYou?lat=40.7128&lon=-74.0060&miles=2',
      '/closureNearYou?street=BROADWAY',
      '/closureNearYou?street=BROADWAY&borough=MANHATTAN'
    ]
  });
});
 
export default router;