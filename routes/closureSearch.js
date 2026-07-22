import { Router } from 'express';
import { nycFetch } from '../nycApi.js';
 
const router = Router();
 
// GET — search closures by street name with optional filters
// Usage: /closureSearch?street=BROADWAY
//        /closureSearch?street=FLATBUSH AVE&borough=BROOKLYN&status=active
router.get('/closureSearch', async (req, res) => {
  const { street, borough, status, limit } = req.query;
 
  if (!street) {
    return res.status(400).json({ error: 'Query param "street" is required' });
  }
 
  const now   = new Date().toISOString();
  const where = [
    `upper(onstreetname) like '%${street.toUpperCase().replace(/'/g, "''")}%'`
  ];
 
  if (borough)             where.push(`upper(boroughname)=upper('${borough.replace(/'/g, "''")}')`);
  if (status === 'active') where.push(`workenddate>='${now}'`);
  if (status === 'past')   where.push(`workenddate<'${now}'`);
 
  const rowLimit = Math.min(parseInt(limit) || 50, 100);
 
  try {
    const data = await nycFetch({
      $limit: rowLimit,
      $order: 'workstartdate DESC',
      $where: where.join(' AND '),
    });
 
    if (!data.length) {
      return res.status(404).json({ message: `No closures found for street: ${street}` });
    }
 
    const results = data.map(row => {
      const start = row.workstartdate ? new Date(row.workstartdate) : null;
      const end   = row.workenddate   ? new Date(row.workenddate)   : null;
      const durationDays = start && end
        ? Math.round((end - start) / 86400000)
        : null;
 
      let closureStatus = 'unknown';
      if (end) {
        const n = new Date();
        if (end < n)               closureStatus = 'completed';
        else if (start && start > n) closureStatus = 'upcoming';
        else                       closureStatus = 'active';
      }
 
      return {
        street:      row.onstreetname   || null,
        fromStreet:  row.fromstreetname || null,
        toStreet:    row.tostreetname   || null,
        borough:     row.boroughname    || null,
        workType:    row.purpose        || null,
        startDate:   row.workstartdate  || null,
        endDate:     row.workenddate    || null,
        durationDays,
        status:      closureStatus,
      };
    });
 
    return res.status(200).json({
      count:   results.length,
      filters: {
        street:  street.toUpperCase(),
        borough: borough || 'all',
        status:  status  || 'all',
      },
      results,
    });
 
  } catch (err) {
    console.error('[/closureSearch] NYC API error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch closure search results from NYC API' });
  }
});
 
export default router;