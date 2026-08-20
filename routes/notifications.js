// routes/notifications.js
// Page + JSON endpoints for the logged-in user's notifications.
// The user id ALWAYS comes from the session, never from params/body.

import { Router } from 'express';
import { notificationsData } from '../data/index.js';
import * as users from '../data/users.js';
import * as closures from "../data/closures.js";
import * as helpers from '../helpers.js';

const router = Router();

// app.js middleware only redirects logged-out GETs, so the JSON endpoints
// (including non-GETs) check the session themselves
const requireSessionJson = (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ error: 'You must be logged in.' });
    return false;
  }
  return true;
};

// street-name normalization for notification matching:
// "5th Avenue" / "5 Ave" / "5 av" all become "5 av" so saved streets match
// closures regardless of how either was typed
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

// Closures with an official end date stay visible while they're active --
// long-term construction can legitimately run for years, and the end date is
// the source of truth. Reports with NO end date can't be trusted forever, so
// they expire from notifications this many days after the last time a user
// confirmed (corroborated) them.
const ONGOING_REPORT_WINDOW_DAYS = 90;

// GET /notifications -- the page
router.get('/', async (req, res) => {
    try {
        const id = helpers.checkId(req.session.user._id);
        const savedStreets = await users.getUserPlaces(id);

        const today = new Date().toISOString().slice(0, 10);
        const cutoff = new Date(Date.now() - ONGOING_REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000)
            .toISOString().slice(0, 10);
        const allClosures = await closures.getAllClosures();
        const notifications = [];
        for (const closure of allClosures) {
            if (closure.work_end_date) {
                // skip closures that have already ended
                if (closure.work_end_date < today) continue;
            } else {
                // no end date: stay visible while the report is recent OR while
                // users keep corroborating that the road is actually still closed
                const lastConfirmed = closure.last_confirmed_date || closure.date_reported;
                if (lastConfirmed < cutoff) continue;
            }
            const fields = [closure.on_street_name, closure.from_street_name, closure.to_street_name];
            // prefer an exact street match for the label, fall back to the loose one
            const matchedStreet =
                savedStreets.find((s) => fields.some((f) => streetContains(f, s))) ||
                savedStreets.find((s) => fields.some((f) => streetContainsLoose(f, s)));
            if (!matchedStreet) continue;
            notifications.push({
                closureId: closure._id.toString(),
                street: closure.on_street_name,
                savedStreet: matchedStreet,
                dateReported: closure.date_reported,
                endDate: closure.work_end_date,
                ongoing: !closure.work_end_date,
                lastConfirmed: (closure.last_confirmed_date && closure.last_confirmed_date !== closure.date_reported)
                    ? closure.last_confirmed_date
                    : null
            });
        }
        notifications.sort((a, b) => new Date(b.dateReported) - new Date(a.dateReported));

        return res.render("notifications", {
            layout: 'home',
            css: 'notifications',
            title: 'Notifications',
            notifications,
            hasNotifications: notifications.length > 0,
            loggedIn: req.session.user ? true : false
        });
    } catch (e) {
        return res.status(500).render("error", {
            layout: 'home',
            title: "Error",
            error: e,
            loggedIn: req.session.user ? true : false
        });
    }
});

// GET /notifications/unreadCount -- JSON for the sidebar badge
router.get('/unreadCount', async (req, res) => {
  if (!requireSessionJson(req, res)) return;
  try {
    const count = await notificationsData.getUnreadCount(req.session.user._id);
    return res.json({ count });
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

// POST /notifications/readAll
router.post('/readAll', async (req, res) => {
  if (!requireSessionJson(req, res)) return;
  try {
    const result = await notificationsData.markAllAsRead(req.session.user._id);
    return res.json(result);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

// POST /notifications/:id/read
router.post('/:id/read', async (req, res) => {
  if (!requireSessionJson(req, res)) return;
  try {
    const result = await notificationsData.markAsRead(
      req.params.id,
      req.session.user._id
    );
    return res.json(result);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

export default router;
