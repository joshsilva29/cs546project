import { Router } from 'express';
import { nycFetch } from '../nycApi.js';
 
const router = Router();
 
// GET — get closures near a street name since dataset has no lat/lon
// Usage: /closureNearYou?street=BROADWAY&borough=MANHATTAN
router.get('/closureNearYou', async (req, res) => {
  const { street, borough } = req.query;
 
  if (!street) {
    return res.status(400).json({ error: 'Query param "street" is required' });
  }
 
  const where = [
    `upper(onstreetname) like '%${street.toUpperCase().replace(/'/g, "''")}%'`
  ];
 
  // Also search cross streets to find closures near the street
  const nearbyWhere = [
    `upper(fromstreetname) like '%${street.toUpperCase().replace(/'/g, "''")}%'`,
    `upper(tostreetname) like '%${street.toUpperCase().replace(/'/g, "''")}%'`
  ];
 
  if (borough) {
    where.push(`upper(boroughname)=upper('${borough.replace(/'/g, "''")}')`);
    nearbyWhere.push(`upper(boroughname)=upper('${borough.replace(/'/g, "''")}')`);
  }
 
  try {
    // Fetch closures ON the street and NEAR the street (cross streets)
    const [onStreet, nearStreet] = await Promise.all([
      nycFetch({
        $limit: 25,
        $order: 'workstartdate DESC',
        $where: where.join(' AND '),
      }),
      nycFetch({
        $limit: 25,
        $order: 'workstartdate DESC',
        $where: nearbyWhere.join(' OR '),
      }),
    ]);
 
    // Combine and remove duplicates by oftcode
    const seen = new Set();
    const combined = [...onStreet, ...nearStreet].filter(row => {
      if (seen.has(row.oftcode)) return false;
      seen.add(row.oftcode);
      return true;
    });
 
    if (!combined.length) {
      return res.status(404).json({ message: `No closures found near: ${street}` });
    }
 
    const results = combined.map(row => {
      const start = row.workstartdate ? new Date(row.workstartdate) : null;
      const end   = row.workenddate   ? new Date(row.workenddate)   : null;
      const durationDays = start && end
        ? Math.round((end - start) / 86400000)
        : null;
 
      return {
        street:      row.onstreetname   || null,
        fromStreet:  row.fromstreetname || null,
        toStreet:    row.tostreetname   || null,
        borough:     row.boroughname    || null,
        workType:    row.purpose        || null,
        startDate:   row.workstartdate  || null,
        endDate:     row.workenddate    || null,
        durationDays,
      };
    });
 
    return res.status(200).json({
      count:   results.length,
      street:  street.toUpperCase(),
      borough: borough || 'all',
      results,
    });
 
  } catch (err) {
    console.error('[/closureNearYou] NYC API error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch nearby closures from NYC API' });
  }
});
 
export default router;