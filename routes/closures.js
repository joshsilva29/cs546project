import { Router } from 'express';
import { closuresData } from '../data/index.js';
const router = Router();

//get duration of closure
router.get('/duration/:id', async (req, res) => {
  try {
    const duration = await closuresData.getClosureDuration(req.params.id);
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
    const history = await closuresData.getClosureHistory(street);
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
    // query params always arrive as strings, so these need to be coerced to numbers
    // before hitting the data layer's checkNumber / checkLatitude / checkLongitude
    const nearby = await closuresData.getClosuresNearLocation(
      Number(latitude),
      Number(longitude),
      maxDistanceMiles !== undefined ? Number(maxDistanceMiles) : undefined // optional -- defaults to 1 mile in the data layer if omitted
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
    const results = await closuresData.searchClosuresByStreet(street);
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

    const newClosure = await closuresData.createClosure(
      reported_by,
      on_street_name,
      from_street_name,
      to_street_name,
      date_reported,
      work_end_date,
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
    const closure = await closuresData.getClosureById(req.params.id);
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
    const updated = await closuresData.corroborateClosure(req.params.id, userId);
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
    const updated = await closuresData.addComment(req.params.id, comment_text, user_id);
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
    const updated = await closuresData.setClosureEndDate(req.params.id, work_end_date);
    return res.json(updated);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

// delete a closure
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await closuresData.removeClosure(req.params.id);
    return res.json(deleted);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

export default router;