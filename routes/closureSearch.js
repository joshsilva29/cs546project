import { Router } from 'express';
import { nycFetch } from '../data/nycApi.js';
import * as helpers from '../helpers.js';
import xss from 'xss';
 
const router = Router();

const VALID_BOROUGHS = ['MANHATTAN', 'BROOKLYN', 'QUEENS', 'BRONX', 'STATEN ISLAND'];

//Validate an optional borough name. Returns undefined when not provided.
const checkBorough = (borough) => {
  if(borough === undefined)  return undefined;
  const cleaned = xss(helpers.checkString(borough, 'borough')).toUpperCase();
  if (!vALID_BOROUGHS.includes(cleaned)) {
    throw `borough must be one of: ${VALID_BOROUGHS.join(', ')}`;
  }
  return cleaned;
}
 
//Validate an optional status. Returns undefined when not provided.
const checkStatus = (status) => {
  if(status === undefined) return undefined;
  const cleaned = xss(helpers.checkString(status, 'status')).toLowerCase();
  if(cleaned !== 'active' && cleaned !== 'past') {
    throw 'status must be either "active" or "past"';
  }
  return cleaned;
};

//Validate an optional row limit. Returns a number between 1 and 100.
const checkLimit = (limit) => {
  if(limit === undefined) return 50; 
  const cleaned = xss(helpers.checkString(String(limit), "limit"));
  const num = Number(cleaned);
  helpers.checkNumber(num, 'limit');
  if (!Number.isInteger(num)) throw 'limit must be a whole number.';
  if (num < 1) throw 'limit must be at least 1.';
  return Math.min(num, 100); 
};

// GET — search closures by street name with optional filters
// Usage: /closureSearch?street=BROADWAY
//        /closureSearch?street=FLATBUSH AVE&borough=BROOKLYN&status=active
router.get('/closureSearch', async (req, res) => {
  const { street, borough, status, limit } = req.query;


  //validate first, then sanitize -- checkString rejects arrays/objects before xss
  //Sanitize input to prevent XSS attacks:
  
  let cleanStreet, cleanBorough, cleanStatus, rowLimit;
  try {
    cleanStreet  = xss(helpers.checkString(street, 'street'));
    cleanBorough = checkBorough(borough);
    cleanStatus  = checkStatus(status);
    rowLimit     = checkLimit(limit);
  }catch (e) {
    return res.status(400).json({ error: e });
  }

 
  const now   = new Date().toISOString().slice(0, -1); //remove the 'Z' at the end of the timestamp;
  const where = [
    `upper(onstreetname) like '%${cleanStreet.toUpperCase().replace(/'/g, "''")}%'`
  ];
 
  if (cleanBorough)             where.push(`upper(boroughname)=upper('${cleanBorough.replace(/'/g, "''")}')`);
  if (cleanStatus === 'active') where.push(`workenddate>='${now}'`);
  if (cleanStatus === 'past')   where.push(`workenddate<'${now}'`);
 
 
 
  try {
    const data = await nycFetch({
      $limit: rowLimit,
      $order: 'workstartdate DESC',
      $where: where.join(' AND '),
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
        oftcode:     row.oftcode        || null,
        startDate:   row.workstartdate  || null,
        endDate:     row.workenddate    || null,
        durationDays,
        status:      closureStatus,
      };
    });
 
    return res.status(200).json({
      count:   results.length,
      filters: {
        street:  cleanStreet.toUpperCase(),
        borough: cleanBorough || 'all',
        status:  cleanStatus  || 'all',
      },
      results,
    });
 
  } catch (err) {
    console.error('[/closureSearch] NYC API error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch closure search results from NYC API' });
  }
});
 
export default router;