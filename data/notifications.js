// data/notifications.js
// Notifications data layer.
// One document per notification per user:
// { _id, user_id, type, closure_id, message, street, created_at, read }
// user_id / closure_id are stored as strings (matching corroborated_by in closures).

import { notificationCollection, userCollection } from '../config/mongoCollections.js';
import * as helpers from '../helpers.js';
import { ObjectId } from 'mongodb';

// indexes for the two access patterns: list newest-first, count unread
export const ensureNotificationIndexes = async () => {
  const notifications = await notificationCollection();
  await notifications.createIndex({ user_id: 1, created_at: -1 });
  await notifications.createIndex({ user_id: 1, read: 1 });
};

// CREATE
export const createNotification = async (
  user_id,
  type,
  closure_id,
  message,
  street // pass null if the notification isn't tied to a saved street
) => {
  user_id = helpers.checkId(user_id, 'user_id');
  type = helpers.checkNotificationType(type);
  closure_id = helpers.checkId(closure_id, 'closure_id');
  message = helpers.checkString(message, 'message');
  if (street !== null && street !== undefined) {
    street = helpers.checkString(street, 'street');
  } else {
    street = null;
  }

  const notifications = await notificationCollection();

  const newNotification = {
    _id: new ObjectId(),
    user_id,
    type,
    closure_id,
    message,
    street,
    created_at: new Date(),
    read: false,
  };

  const insertInfo = await notifications.insertOne(newNotification);
  if (!insertInfo.acknowledged) throw new Error('Could not create notification.');

  return newNotification;
};

// READ
export const getNotificationsByUser = async (user_id, limit = 50) => {
  user_id = helpers.checkId(user_id, 'user_id');
  limit = helpers.checkNumber(limit, 'limit');
  if (limit < 1) limit = 1;
  if (limit > 200) limit = 200;

  const notifications = await notificationCollection();
  return await notifications
    .find({ user_id })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
};

// cheap index-covered count for the sidebar badge
export const getUnreadCount = async (user_id) => {
  user_id = helpers.checkId(user_id, 'user_id');
  const notifications = await notificationCollection();
  return await notifications.countDocuments({ user_id, read: false });
};

// UPDATE
// user_id is part of the filter so a user can never mark someone else's notification
export const markAsRead = async (notificationId, user_id) => {
  notificationId = helpers.checkId(notificationId, 'notification id');
  user_id = helpers.checkId(user_id, 'user_id');

  const notifications = await notificationCollection();
  const updateInfo = await notifications.updateOne(
    { _id: new ObjectId(notificationId), user_id },
    { $set: { read: true } }
  );
  if (updateInfo.matchedCount === 0) {
    throw 'No notification found for this user with that id.';
  }
  return { updated: true };
};

export const markAllAsRead = async (user_id) => {
  user_id = helpers.checkId(user_id, 'user_id');
  const notifications = await notificationCollection();
  const updateInfo = await notifications.updateMany(
    { user_id, read: false },
    { $set: { read: true } }
  );
  return { updated: true, count: updateInfo.modifiedCount };
};

// DELETE
// cleanup hook so deleting a closure leaves no dead notification links
export const removeNotificationsForClosure = async (closure_id) => {
  closure_id = helpers.checkId(closure_id, 'closure_id');
  const notifications = await notificationCollection();
  const deleteInfo = await notifications.deleteMany({ closure_id });
  return { deleted: deleteInfo.deletedCount };
};

// GENERATORS ---------------------------------------------------------------
// These are best-effort: callers wrap them in try/catch so a notification
// failure never makes the underlying closure action fail.

// normalized comparison -- never builds a RegExp from user input.
// "5th Avenue" / "5 Ave" / "5 av" all normalize to "5 av" so saved streets
// match closures regardless of how either was typed.
const normalizeStreet = (name) => String(name).toLowerCase()
  .replace(/(\d+)(st|nd|rd|th)\b/g, '$1')
  .replace(/\bavenue\b|\bave\b/g, 'av')
  .replace(/\bstreet\b/g, 'st')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

// whole-token containment: "4 av" matches "4 av" but not "14 av"
const streetContains = (closureStreet, savedStreet) => {
  const field = ` ${normalizeStreet(closureStreet)} `;
  const saved = normalizeStreet(savedStreet);
  return saved.length > 0 && field.includes(` ${saved} `);
};

// looser retry with a trailing street-type word dropped ("34 st" matches "34th")
const STREET_TYPE_TOKENS = new Set(['st', 'av', 'rd', 'blvd', 'pl', 'ln', 'dr']);
const streetContainsLoose = (closureStreet, savedStreet) => {
  const tokens = normalizeStreet(savedStreet).split(' ').filter(Boolean);
  if (tokens.length < 2 || !STREET_TYPE_TOKENS.has(tokens[tokens.length - 1])) return false;
  return streetContains(closureStreet, tokens.slice(0, -1).join(' '));
};

const streetsMatch = (closureStreet, savedStreet) =>
  streetContains(closureStreet, savedStreet) || streetContainsLoose(closureStreet, savedStreet);

// find every user whose saved streets match this closure and build one
// notification doc per user (skipping the reporter if asked).
// Two DB round-trips total: one projected find, one insertMany (by caller).
const buildDocsForMatchingUsers = async (closure, type, message, skipReporter) => {
  const closureId = closure._id.toString();
  const closureStreets = [
    closure.on_street_name,
    closure.from_street_name,
    closure.to_street_name,
  ].filter((s) => typeof s === 'string' && s.trim().length > 0);

  const users = await userCollection();
  const savers = await users
    .find(
      { user_places: { $exists: true, $ne: [] } },
      { projection: { _id: 1, user_places: 1 } }
    )
    .toArray();

  const docs = [];
  for (const u of savers) {
    const uid = u._id.toString();
    if (skipReporter && uid === closure.reported_by) continue;

    const matched = (u.user_places || []).find(
      (place) =>
        typeof place === 'string' &&
        closureStreets.some((s) => streetsMatch(s, place))
    );
    if (!matched) continue; // at most one notification per user per closure

    docs.push({
      _id: new ObjectId(),
      user_id: uid,
      type,
      closure_id: closureId,
      message,
      street: matched,
      created_at: new Date(),
      read: false,
    });
  }
  return docs;
};

// called after a new closure is reported
export const notifyUsersForClosure = async (closure) => {
  if (!closure || !closure._id) throw 'closure is required.';
  const message =
    `New closure reported on ${closure.on_street_name} ` +
    `(from ${closure.from_street_name} to ${closure.to_street_name}).`;

  const docs = await buildDocsForMatchingUsers(
    closure,
    'saved_street_closure',
    message,
    true // don't notify the reporter about their own report
  );
  if (docs.length === 0) return { notified: 0 };

  const notifications = await notificationCollection();
  await notifications.insertMany(docs);
  return { notified: docs.length };
};

// called after someone corroborates a closure -- tells the original reporter
export const notifyClosureCorroborated = async (closure, corroboratingUserId) => {
  if (!closure || !closure._id) throw 'closure is required.';
  corroboratingUserId = helpers.checkId(corroboratingUserId, 'user id');
  if (closure.reported_by === corroboratingUserId) return { notified: 0 };

  await createNotification(
    closure.reported_by,
    'corroboration',
    closure._id.toString(),
    `Another user confirmed your reported closure on ${closure.on_street_name}.`,
    null
  );
  return { notified: 1 };
};

// called after a closure's end date is set -- tells users who saved the street
export const notifyClosureEnded = async (closure) => {
  if (!closure || !closure._id) throw 'closure is required.';
  const message =
    `The closure on ${closure.on_street_name} ` +
    `(from ${closure.from_street_name} to ${closure.to_street_name}) ` +
    `now has an end date: ${closure.work_end_date}.`;

  const docs = await buildDocsForMatchingUsers(
    closure,
    'closure_update',
    message,
    false // reporter cares about this too
  );
  if (docs.length === 0) return { notified: 0 };

  const notifications = await notificationCollection();
  await notifications.insertMany(docs);
  return { notified: docs.length };
};
