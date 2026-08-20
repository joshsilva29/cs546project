import { Router } from 'express';
import { closuresData, notificationsData } from '../data/index.js';
import xss from 'xss';

const router = Router();

//get duration of closure
router.get('/duration/:id', async (req, res) => {
  try {
    const cleanId = xss(req.params.id);
    const duration = await closuresData.getClosureDuration(cleanId);
    return res.json(duration);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

//get history of closures on this street (street sent as a query param)
router.get('/history', async (req, res) => {
  try {
    const { street } = req.query;
    if (!street) throw 'Error: street is required as a query param.';
    const cleanStreet = xss(street);
    const history = await closuresData.getClosureHistory(cleanStreet);
    return res.json(history);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

//get closures near a current location (lat/long sent as query params)
router.get('/nearYou', async (req, res) => {
  try {
    const { latitude, longitude, maxDistanceMiles } = req.query;
    if (latitude === undefined || longitude === undefined) {
      throw 'Error: latitude and longitude are required as query params.';
    }
    const cleanLatitude = xss(String(latitude));
    const cleanLongitude = xss(String(longitude));
    const cleanMaxDistanceMiles = maxDistanceMiles !== undefined ? xss(String(maxDistanceMiles)) : undefined;
    // query params always arrive as strings, so these need to be coerced to numbers
    // before hitting the data layer's checkNumber / checkLatitude / checkLongitude
    const nearby = await closuresData.getClosuresNearLocation(
      Number(cleanLatitude),
      Number(cleanLongitude),
      cleanMaxDistanceMiles !== undefined ? Number(cleanMaxDistanceMiles) : undefined // optional -- defaults to 1 mile in the data layer if omitted
    );
    return res.json(nearby);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

//get closures in or around a certain street (street sent as a query param)
router.get('/closureSearch', async (req, res) => {
  try {
    const { street } = req.query;
    if (!street) throw 'Error: street is required as a query param.';
    const cleanStreet = xss(street);
    const results = await closuresData.searchClosuresByStreet(cleanStreet);
    return res.json(results);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

//get active or inactive closures in or around a certain street (street sent as a query param)
router.get('/closureHistoryFiltered', async (req, res) => {
  try {
    const { street, status } = req.query;
    if (!street) throw 'Error: street is required as a query param.';
    if (!status) throw 'Error: status is required as a query param.';
    const cleanStreet = xss(street);
    const cleanStatus = xss(status);
    const results = await closuresData.getClosureHistoryFiltered(cleanStreet, cleanStatus);
    return res.json(results);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

// ---------------------------------------------------------------------------------
// Routes below this line weren't in the original file -- adding them so every
// closures.js data function has something to hit over HTTP (for Bruno / the
// frontend). Remove or adjust to taste.
// ---------------------------------------------------------------------------------

// create a new closure (manual street entry or pinned-location report)
router.post('/', async (req, res) => {
  try {
    const {
      reported_by,
      on_street_name,
      from_street_name,
      to_street_name,
      date_reported,
      work_end_date,
      closure_location,
      affects_sidewalk,
      affects_roads,
      affects_bike_lanes,
    } = req.body;

    const cleanReportedBy    = xss(reported_by);
    const cleanOnStreetName  = xss(on_street_name);
    const cleanFromStreetName = xss(from_street_name);
    const cleanToStreetName  = xss(to_street_name);
    const cleanDateReported  = xss(date_reported);
    // xss() turns null/undefined into "" which fails date validation --
    // keep it null so ongoing closures (no end date) can be reported
    const cleanWorkEndDate   = (work_end_date === null || work_end_date === undefined)
      ? null
      : xss(work_end_date);

    const newClosure = await closuresData.createClosure(
      cleanReportedBy,
      cleanOnStreetName,
      cleanFromStreetName,
      cleanToStreetName,
      cleanDateReported,
      cleanWorkEndDate,
      closure_location,
      affects_sidewalk,
      affects_roads,
      affects_bike_lanes
    );
    return res.status(201).json(newClosure);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

// get all closures
router.get('/', async (req, res) => {
  try {
    const closures = await closuresData.getAllClosures();
    return res.json(closures);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

// get a single closure by id
router.get('/:id', async (req, res) => {
  try {
    const cleanId = xss(req.params.id);
    const closure = await closuresData.getClosureById(cleanId);
    return res.json(closure);
  } catch (e) {
    return res.status(404).json({ error: e });
  }
});

// confirm/corroborate an existing closure -- "user can confirm there is a road closure"
router.post('/:id/corroborate', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) throw 'Error: userId is required in the request body.';
    const cleanId = xss(req.params.id);
    const cleanUserId = xss(userId);
    const updated = await closuresData.corroborateClosure(cleanId, cleanUserId);
    // best-effort: tell the original reporter their closure was confirmed
    try { await notificationsData.notifyClosureCorroborated(updated, cleanUserId); }
    catch (err) { console.error('[corroborate] notification failed:', err); }
    return res.json(updated);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

// add a comment to a closure
router.post('/:id/comments', async (req, res) => {
  try {
    const { comment_text, user_id } = req.body;
    if (!comment_text || !user_id) {
      throw 'Error: comment_text and user_id are required in the request body.';
    }
    const cleanId = xss(req.params.id);
    const cleanCommentText = xss(comment_text);
    const cleanUserId = xss(user_id);
    const updated = await closuresData.addComment(cleanId, cleanCommentText, cleanUserId);
    return res.status(201).json(updated);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

// set/update a closure's end date once it's resolved
router.patch('/:id/endDate', async (req, res) => {
  try {
    const { work_end_date } = req.body;
    if (!work_end_date) throw 'Error: work_end_date is required in the request body.';
    const cleanId = xss(req.params.id);
    const cleanWorkEndDate = xss(work_end_date);
    const updated = await closuresData.setClosureEndDate(cleanId, cleanWorkEndDate);
    // best-effort: tell users who saved this street that an end date was set
    try { await notificationsData.notifyClosureEnded(updated); }
    catch (err) { console.error('[endDate] notification failed:', err); }
    return res.json(updated);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

// delete a closure
router.delete('/:id', async (req, res) => {
  try {
    const cleanId = xss(req.params.id);
    const deleted = await closuresData.removeClosure(cleanId);
    // clean up notifications that point at the deleted closure (no dead links)
    try { await notificationsData.removeNotificationsForClosure(cleanId); }
    catch (err) { console.error('[delete closure] notification cleanup failed:', err); }
    return res.json(deleted);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

export default router;