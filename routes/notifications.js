// routes/notifications.js
// Page + JSON endpoints for the logged-in user's notifications.
// The user id ALWAYS comes from the session, never from params/body.

import { Router } from 'express';
import { notificationsData } from '../data/index.js';

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

// GET /notifications -- the page
router.get('/', async (req, res) => {
  try {
    const raw = await notificationsData.getNotificationsByUser(
      req.session.user._id
    );
    const notifications = raw.map((n) => ({
      _id: n._id.toString(),
      message: n.message,
      street: n.street,
      closure_id: n.closure_id,
      read: n.read,
      created_at: new Date(n.created_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    }));

    return res.render('notifications', {
      layout: 'home',
      css: 'notifications',
      title: 'Notifications',
      loggedIn: true,
      notifications,
      hasNotifications: notifications.length > 0,
    });
  } catch (e) {
    return res.status(500).render('error', {
      layout: 'home',
      title: 'Error',
      error: e,
      loggedIn: req.session.user ? true : false,
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
