import { Router } from 'express';
import { nycFetch } from '../nycApi.js';
import xss from 'xss';

const router = Router();

// GET — get a specific closure by its oftcode
// Usage: /getClosure/113610137310197530
router.get('/getClosure/:oftcode/:startDate/:endDate', async (req, res) => {
  const { oftcode, startDate, endDate } = req.params;

  if (!oftcode) {
    return res.status(400).json({ error: 'Path param "oftcode" is required' });
  }

  const cleanOftcode = xss(oftcode);
  const cleanStartDate = xss(startDate);
  const cleanEndDate = xss(endDate);

  const where = `
    oftcode='${cleanOftcode.replace(/'/g, "''")}' AND 
    workstartdate='${cleanStartDate}' AND 
    workenddate='${cleanEndDate}'
  `;

  try {
    const data = await nycFetch({
      $limit: 1,
      $where: where,
    });

    if (!data.length) {
      return res.status(404).json({ message: `No closure found for oftcode: ${cleanOftcode}` });
    }

    const row = data[0];
    const start = row.workstartdate ? new Date(row.workstartdate) : null;
    const end   = row.workenddate   ? new Date(row.workenddate)   : null;
    const durationDays = start && end
      ? Math.round((end - start) / 86400000)
      : null;

    let closureStatus = 'unknown';
    if (end) {
      const n = new Date();
      if (end < n)                 closureStatus = 'completed';
      else if (start && start > n) closureStatus = 'upcoming';
      else                         closureStatus = 'active';
    }

    const result = {
      oftcode:     row.oftcode        || null,
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

    return res.status(200).json({ result });

  } catch (err) {
    console.error('[/getClosure] NYC API error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch closure from NYC API' });
  }
});

export default router;