
import { Router } from 'express';
import { nycFetch } from '../nycApi.js';
 
const router = Router();
 
// GET — get history of closures, filterable by borough, status, and date range
// Usage: /closureHistory
//        /closureHistory?borough=MANHATTAN
//        /closureHistory?borough=BROOKLYN&status=past&from=2024-01-01&to=2024-12-31
router.get('/closureHistory', async (req, res) => {
  const { borough, status, from, to, limit } = req.query;
 
  const where = [];
  const now   = new Date().toISOString();
 
  if (borough) where.push(`upper(boroughname)=upper('${borough.replace(/'/g, "''")}')`);
  if (status === 'active') where.push(`workenddate>='${now}'`);
  if (status === 'past')   where.push(`workenddate<'${now}'`);
  if (from)    where.push(`workstartdate>='${from}T00:00:00'`);
  if (to)      where.push(`workstartdate<='${to}T23:59:59'`);
 
  const rowLimit = Math.min(parseInt(limit) || 50, 100);
 
  try {
    const data = await nycFetch({
      $limit: rowLimit,
      $order: 'workstartdate DESC',
      ...(where.length && { $where: where.join(' AND ') }),
    });
 
    if (!data.length) {
      return res.status(404).json({ message: 'No closures found matching your filters.' });
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
      filters: { borough: borough || 'all', status: status || 'all', from, to },
      results,
    });
 
  } catch (err) {
    console.error('[/closureHistory] NYC API error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch closure history from NYC API' });
  }
});
 
export default router;