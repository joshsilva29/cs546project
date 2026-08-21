import { Router } from 'express';
import { nycFetch } from '../data/nycApi.js';
import * as helpers from '../helpers.js';
import xss from 'xss';
 
const router = Router();
 
// GET — get duration of closure on a street
// Usage: /closureDuration?street=BROADWAY
router.get('/closureDuration', async (req, res) => {
  const { street } = req.query;

  //Sanitize input to prevent XSS attacks:

  let cleanStreet;
  try {
    cleanStreet = xss(helpers.checkString(street, 'street'));
  } catch (e) {
  return res.status(400).json({ error: e.message || e });
}
 
  try {
    const data = await nycFetch({
      $limit: 30,
      $order: 'workstartdate DESC',
      $where: `upper(onstreetname) like '%${cleanStreet.toUpperCase().replace(/'/g, "''")}%'`,
    });
 
    if (!data.length) {
      return res.status(404).json({ message: `No closures found for street: ${cleanStreet}` });
    }
 
    const results = data.map(row => {
      const start = row.workstartdate ? new Date(row.workstartdate) : null;
      const end   = row.workenddate   ? new Date(row.workenddate)   : null;
      const durationDays = start && end
        ? Math.round((end - start) / 86400000)
        : null;
 
      return {
        street:       row.onstreetname  || null,
        fromStreet:   row.fromstreetname || null,
        toStreet:     row.tostreetname   || null,
        borough:      row.boroughname    || null,
        workType:     row.purpose        || null,
        startDate:    row.workstartdate  || null,
        endDate:      row.workenddate    || null,
        durationDays,
      };
    });
 
    return res.status(200).json({
      count: results.length,
      street: cleanStreet.toUpperCase(),
      results,
    });
 
  } catch (err) {
    console.error('[/closureDuration] NYC API error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch duration data from NYC API' });
  }
});
 
export default router;