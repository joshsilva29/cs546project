
import { Router } from 'express';
import { nycFetch } from '../data/nycApi.js';
import * as helpers from '../helpers.js'
import xss from 'xss';
 
const router = Router();

//Boroughs as they in the ezy6-djsf dataset (full names).
const VALID_BOROUGHS = ['MANHATTAN', 'BROOKLYN', 'QUEENS', 'BRONX', 'STATEN ISLAND'];

//validate an optional borough name. Returns undefined when not provided.
const checkBorough = (borough) => {
  if(borough === undefined)  return undefined;
  const cleaned = xss(helpers.checkString(borough, 'borough')).toUpperCase();
  if (!VALID_BOROUGHS.includes(cleaned)) {
    throw `borough must be one of: ${VALID_BOROUGHS.join(', ')}`;
  }
  return cleaned;
};


//validate an optional status. Returns undefined when not provided.
const checkStatus = (status) => {
  if(status === undefined) return undefined;
  const cleaned = xss(helpers.checkString(status, 'status')).toLowerCase();
  if(cleaned !== 'active' && cleaned !== 'past') {
    throw 'status must be either "active" or "past"';
  }
  return cleaned;
}

//validate an optional YYYY-MM-DD date string. Returns undefined when not provided.
const checkQueryDate = (dateStr, name) => {
  if(dateStr === undefined) return undefined;
  const cleaned = xss(helpers.checkString(dateStr, name));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    throw `${name} must be in YYYY-MM-DD format`;
  }
  return cleaned;
};

//validate an optional row limit. Returns a number between 1 and 100.
const checkLimit = (limit) => {
  if(limit === undefined) return 50;
  const cleaned = xss(helpers.checkString(String(limit), "limit"));
  const num = Number(cleaned);
  helpers.checkNumber(num, 'limit');
  if (!Number.isInteger(num)) throw 'limit must be a whole number.';
  if (num < 1) throw 'limit must be at least 1.';
  return Math.min(num, 100);
}

// GET — get history of closures, filterable by borough, status, and date range
// Usage: /closureHistory
//        /closureHistory?borough=MANHATTAN
//        /closureHistory?borough=BROOKLYN&status=past&from=2024-01-01&to=2024-12-31
router.get('/closureHistory', async (req, res) => {
  const { borough, status, from, to, limit } = req.query;

   // Every param here is optional -- each validator returns undefined
  // when the param was not sent, and throws a 400-worthy message otherwise.

  let cleanBorough, cleanStatus, cleanFrom, cleanTo, rowLimit;
  try {
    cleanBorough = checkBorough(borough);
    cleanStatus  = checkStatus(status);
    cleanFrom    = checkQueryDate(from, 'from');
    cleanTo      = checkQueryDate(to, 'to');
    rowLimit     = checkLimit(limit);
  
    if (cleanFrom && cleanTo &&  new Date(cleanFrom) > new Date(cleanTo)) {
      throw 'from date must be on or before to date';
    }
  } catch (e) {
  return res.status(400).json({ error: e.message || e });
}
  
  const where = [];
  const now   = new Date().toISOString().slice(0, -1); //remove the 'Z' at the end of the timestamp

 
  if (cleanBorough) where.push(`upper(boroughname)=upper('${cleanBorough.replace(/'/g, "''")}')`);
  if (cleanStatus === 'active') where.push(`workenddate>='${now}'`);
  if (cleanStatus === 'past')   where.push(`workenddate<'${now}'`);
  if (cleanFrom)    where.push(`workstartdate>='${cleanFrom}T00:00:00'`);
  if (cleanTo)      where.push(`workstartdate<='${cleanTo}T23:59:59'`);
 
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
        oftcode:     row.oftcode        || null,
        startDate:   row.workstartdate  || null,
        endDate:     row.workenddate    || null,
        durationDays,
        status:      closureStatus,
      };
    });
 
    return res.status(200).json({
      count:   results.length,
      filters: { borough: cleanBorough || 'all', status: cleanStatus || 'all', from: cleanFrom , to: cleanTo },
      results,
    });
 
  } catch (err) {
    console.error('[/closureHistory] NYC API error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch closure history from NYC API' });
  }
});
 
export default router;