import { Router } from 'express';
import { nycFetch } from '../nycApi.js';

const router = Router();

// GET — get a specific closure by its oftcode
// Usage: /getClosure/113610137310197530
router.get('/getClosure/:oftcode', async (req, res) => {
  const { oftcode } = req.params;

  if (!oftcode) {
    return res.status(400).json({ error: 'Path param "oftcode" is required' });
  }

  const where = `oftcode='${oftcode.replace(/'/g, "''")}'`;

  try {
    const data = await nycFetch({
      $limit: 1,
      $where: where,
    });

    if (!data.length) {
      return res.status(404).json({ message: `No closure found for oftcode: ${oftcode}` });
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