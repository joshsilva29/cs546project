import { Router } from 'express';
 
const router = Router();
 
// POST — user reports a new street closure
// Body: { street, borough, crossFrom, crossTo, startDate, endDate, workType, notes }
router.post('/reportClosure', (req, res) => {
  const {
    street,
    borough,
    crossFrom,
    crossTo,
    startDate,
    endDate,
    workType,
    notes,
  } = req.body;
 
  // Validation 
  if (!street || !borough || !startDate || !endDate || !workType) {
    return res.status(400).json({
      error: 'Missing required fields: street, borough, startDate, endDate, workType',
    });
  }
 
  if (new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({
      error: 'endDate must be after startDate',
    });
  }
 
  // We will need the data from the user/MongoDb
  // await ClosureReport.create({ street, borough, ... });
 
  return res.status(201).json({
    message: 'Closure report submitted successfully and is pending review.',
    data: {
      street,
      borough,
      crossFrom:  crossFrom || null,
      crossTo:    crossTo   || null,
      startDate,
      endDate,
      workType,
      notes:      notes || null,
      submittedAt: new Date().toISOString(),
    },
  });
});
 
export default router;