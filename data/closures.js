// CLOSURES DATA LAYER
// Note: exclusively user-reported closures
// schema addition - corroborated_by: array of user id strings -> so users can only corroborate once

import { closureCollection } from '../config/mongoCollections.js';
import * as helpers from '../helpers.js';
import { ObjectId } from 'mongodb';

// create text index for street lookups
export const ensureClosureIndexes = async () => {
  const closures = await closureCollection();
  await closures.createIndex({
    on_street_name: 'text',
    from_street_name: 'text',
    to_street_name: 'text',
  });
};

// CREATE
export const createClosure = async (
  reported_by,
  on_street_name,
  from_street_name,
  to_street_name,
  date_reported,
  work_end_date, // pass null if ongoing
  closure_location, // { latitude, longitude } or null
  affects_sidewalk,
  affects_roads,
  affects_bike_lanes
) => {
  reported_by = helpers.checkId(reported_by, 'reported_by');
  on_street_name = helpers.checkString(on_street_name, 'on_street_name');
  from_street_name = helpers.checkString(from_street_name, 'from_street_name');
  to_street_name = helpers.checkString(to_street_name, 'to_street_name');
  date_reported = helpers.checkDateString(date_reported, 'date_reported');
  if (work_end_date !== null && work_end_date !== undefined) {
    work_end_date = helpers.checkDateString(work_end_date, 'work_end_date');
  } else {
    work_end_date = null;
  }
  affects_sidewalk = helpers.checkBoolean(affects_sidewalk, 'affects_sidewalk');
  affects_roads = helpers.checkBoolean(affects_roads, 'affects_roads');
  affects_bike_lanes = helpers.checkBoolean(affects_bike_lanes, 'affects_bike_lanes');

  if (closure_location) {
    closure_location = {
      latitude: helpers.checkLatitude(closure_location.latitude),
      longitude: helpers.checkLongitude(closure_location.longitude),
    };
  } else {
    closure_location = null;
  }

  const closures = await closureCollection();

  const newClosure = {
    _id: new ObjectId(),
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
    corroborated_count: 0,
    corroborated_by: [],
    comments: [],
  };

  const insertInfo = await closures.insertOne(newClosure);
  if (!insertInfo.acknowledged) throw new Error('Could not create closure.');

  return await getClosureById(newClosure._id.toString());
};

// READ
export const getClosureById = async (id) => {
  id = helpers.checkId(id, 'closure id');
  const closures = await closureCollection();
  const closure = await closures.findOne({ _id: new ObjectId(id) });
  if (!closure) throw 'No closure found with that id.';
  return closure;
};

export const getAllClosures = async () => {
  const closures = await closureCollection();
  return await closures.find({}).toArray();
};

// returns closure length plus if it's still active
export const getClosureDuration = async (id) => {
  const closure = await getClosureById(id);
  const start = new Date(closure.date_reported);
  const end = closure.work_end_date ? new Date(closure.work_end_date) : new Date();
  const durationDays = Math.max(
    0,
    Math.round((end - start) / (1000 * 60 * 60 * 24))
  );
  return {
    closure_id: closure._id.toString(),
    duration_days: durationDays,
    ongoing: !closure.work_end_date,
  };
};

// All closures on a given street, most recent first
export const getClosureHistory = async (street) => {
  street = helpers.checkString(street, 'street');
  const closures = await closureCollection();
  const regex = new RegExp(street, 'i');
  return await closures
    .find({
      $or: [
        { on_street_name: regex },
        { from_street_name: regex },
        { to_street_name: regex },
      ],
    })
    .sort({ date_reported: -1 })
    .toArray();
};

// Same underlying query as getClosureHistory, kept as a separate
export const searchClosuresByStreet = async (street) => {
  return await getClosureHistory(street);
};

// I don't totally understand this, but basically you have to account for earth's curvature and can't just use pythagorean formula
// source/inspo: https://medium.com/@sumitsakpal02/how-to-calculate-distance-between-two-coordinates-in-javascript-using-haversine-formula-c2dc0f5d524c
const milesBetween = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  // convert degrees into radians
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  // apply the Haversine formula
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // calculate distance in miles and return
  return R * c;
};

// closures within maxDistanceMiles of given point. Only closures that have a closure_location
export const getClosuresNearLocation = async (
  latitude,
  longitude,
  maxDistanceMiles = 1
) => {
  latitude = helpers.checkLatitude(latitude);
  longitude = helpers.checkLongitude(longitude);
  helpers.checkNumber(maxDistanceMiles, 'maxDistanceMiles');

  const closures = await closureCollection();
  const withLocation = await closures
    .find({ closure_location: { $ne: null } })
    .toArray();

  return withLocation
    .map((c) => ({
      ...c,
      distance_miles: milesBetween(
        latitude,
        longitude,
        c.closure_location.latitude,
        c.closure_location.longitude
      ),
    }))
    .filter((c) => c.distance_miles <= maxDistanceMiles)
    .sort((a, b) => a.distance_miles - b.distance_miles);
};

// UPDATE

// increment corroborated count once per user
export const corroborateClosure = async (closureId, userId) => {
  closureId = helpers.checkId(closureId, 'closure id');
  userId = helpers.checkId(userId, 'user id');

  const closures = await closureCollection();
  const closure = await getClosureById(closureId);

  if (closure.corroborated_by.includes(userId)) {
    throw 'User has already corroborated this closure.';
  }

  const updateInfo = await closures.updateOne(
    { _id: new ObjectId(closureId) },
    {
      $inc: { corroborated_count: 1 },
      $addToSet: { corroborated_by: userId },
    }
  );
  if (updateInfo.matchedCount === 0) throw 'No closure found with that id.';
  return await getClosureById(closureId);
};

export const setClosureEndDate = async (closureId, work_end_date) => {
  closureId = helpers.checkId(closureId, 'closure id');
  work_end_date = helpers.checkDateString(work_end_date, 'work_end_date');

  const closures = await closureCollection();
  const updateInfo = await closures.updateOne(
    { _id: new ObjectId(closureId) },
    { $set: { work_end_date } }
  );
  if (updateInfo.matchedCount === 0) throw 'No closure found with that id.';
  return await getClosureById(closureId);
};

// comments go in subdocument
export const addComment = async (closureId, comment_text, user_id) => {
  closureId = helpers.checkId(closureId, 'closure id');
  comment_text = helpers.checkString(comment_text, 'comment_text');
  user_id = helpers.checkId(user_id, 'user id');

  const comment = {
    _id: new ObjectId(),
    comment_text,
    date_posted: new Date().toISOString().slice(0, 10), // "2026-06-24"
    user_id,
  };

  const closures = await closureCollection();
  const updateInfo = await closures.updateOne(
    { _id: new ObjectId(closureId) },
    { $push: { comments: comment } }
  );
  if (updateInfo.matchedCount === 0) throw 'No closure found with that id.';
  return await getClosureById(closureId);
};

// DELETE
export const removeClosure = async (id) => {
  id = helpers.checkId(id, 'closure id');
  const closures = await closureCollection();
  const deleteInfo = await closures.findOneAndDelete({ _id: new ObjectId(id) });
  if (!deleteInfo) throw 'No closure found with that id.';
  return { ...deleteInfo, deleted: true };
};