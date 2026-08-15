import { Router } from 'express';
import * as users from '../data/users.js'; 
import * as helpers from '../helpers.js';
import { closuresData, notificationsData } from '../data/index.js';

const router = Router();

//can add routes to pages here
// NOTE: GET /notifications used to be a placeholder here -- it now lives in
// routes/notifications.js (mounted at /notifications in routes/index.js).

router.get('/search', async (req, res) => {
    return res.render("search", {
        layout: 'home',
        css: 'search',
        title: 'Search',
        loggedIn: req.session.user ? true : false
    });
});

router.route('/savedStreets')
    .get(async (req, res) => {
        let savedStreets, id;

        try {
            id = helpers.checkId(req.session.user._id); // get id from logged in user
            savedStreets = await users.getUserPlaces(id);
            return res.render("savedStreets", {
                layout: 'home',
                css: 'savedStreets',
                title: 'Saved Streets',
                savedStreets,
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
    })
    .post(async (req, res) => {
        let street, id;

        try {
            id = helpers.checkId(req.session.user._id); // get id from logged in user
            const reqBody = req.body;
            street = helpers.checkStreet(reqBody.save_street_input);
        } catch (e) {
            return res.status(400).render("error", {
                layout: 'home',
                title: "Error",
                error: e,
                loggedIn: req.session.user ? true : false
            });
        }

        try {
            const savedStreets = await users.getUserPlaces(id);
            if (savedStreets.includes(street)) {
                return res.render("savedStreets", {
                    layout: 'home',
                    css: 'savedStreets',
                    title: 'Saved Streets',
                    loggedIn: req.session.user ? true : false,
                    savedStreets,
                    error: 'You already have this street saved'
                });
            }
        } catch (e) {
            return res.status(400).render("error", {
                layout: 'home',
                title: "Error",
                error: e,
                loggedIn: req.session.user ? true : false
            });
        }

        try {
            await users.addUserPlace(id, street);
            const savedStreets = await users.getUserPlaces(id);
            return res.render("savedStreets", {
                layout: 'home',
                css: 'savedStreets',
                title: 'Saved Streets',
                loggedIn: req.session.user ? true : false,
                savedStreets
            });
        } catch (e) {
            return res.status(404).render("error", {
                layout: 'home',
                title: "Error",
                error: e,
                loggedIn: req.session.user ? true : false
            });
        }
    });

router.get('/nearbyClosures', async (req, res) => {
    return res.render("nearbyClosures", {
        layout: 'home',
        css: 'nearbyClosures',
        title: 'Nearby Closures',
        loggedIn: req.session.user ? true : false
    });
});

// REPORT CLOSURE ------------------------------------------------------------

// shared render so every branch (GET, errors, success) looks the same
const renderReportPage = (req, res, extras = {}, status = 200) => {
    return res.status(status).render("reportClosure", {
        layout: 'home',
        css: 'reportClosure',
        title: 'Report Closure',
        loggedIn: req.session.user ? true : false,
        ...extras
    });
};

router.route('/reportClosure')
    .get(async (req, res) => {
        return renderReportPage(req, res);
    })
    .post(async (req, res) => {
        // app.js middleware only guards GETs, so guard the POST explicitly
        if (!req.session.user) return res.redirect('/users/login');

        const body = req.body || {};

        // keep raw inputs so the form can be re-rendered without retyping
        const formData = {
            on_street_name: typeof body.on_street_name === 'string' ? body.on_street_name : '',
            from_street_name: typeof body.from_street_name === 'string' ? body.from_street_name : '',
            to_street_name: typeof body.to_street_name === 'string' ? body.to_street_name : '',
            work_end_date: typeof body.work_end_date === 'string' ? body.work_end_date : '',
            affects_sidewalk: Boolean(body.affects_sidewalk),
            affects_roads: Boolean(body.affects_roads),
            affects_bike_lanes: Boolean(body.affects_bike_lanes),
            latitude: typeof body.latitude === 'string' ? body.latitude : '',
            longitude: typeof body.longitude === 'string' ? body.longitude : ''
        };

        // collect ALL field errors in one pass instead of failing one at a time
        const errors = [];
        let on_street_name, from_street_name, to_street_name;
        let work_end_date = null;
        let closure_location = null;

        try { on_street_name = helpers.checkString(body.on_street_name, 'Current street'); }
        catch (e) { errors.push(String(e)); }
        try { from_street_name = helpers.checkString(body.from_street_name, 'From street'); }
        catch (e) { errors.push(String(e)); }
        try { to_street_name = helpers.checkString(body.to_street_name, 'To street'); }
        catch (e) { errors.push(String(e)); }

        if (on_street_name && on_street_name.length > 100) errors.push('Current street must be 100 characters or fewer.');
        if (from_street_name && from_street_name.length > 100) errors.push('From street must be 100 characters or fewer.');
        if (to_street_name && to_street_name.length > 100) errors.push('To street must be 100 characters or fewer.');

        if (from_street_name && to_street_name &&
            from_street_name.toLowerCase() === to_street_name.toLowerCase()) {
            errors.push('From street and To street must be different.');
        }

        // date_reported is ALWAYS server-generated -- the client never controls it
        const date_reported = new Date().toISOString().slice(0, 10);

        // optional end date: blank means ongoing (null)
        if (typeof body.work_end_date === 'string' && body.work_end_date.trim().length > 0) {
            try {
                work_end_date = helpers.checkDateString(body.work_end_date.trim(), 'Expected end date');
                if (new Date(work_end_date) < new Date(date_reported)) {
                    errors.push('Expected end date cannot be in the past.');
                    work_end_date = null;
                }
            } catch (e) {
                errors.push(String(e));
            }
        }

        // at least one impact type must be selected
        const affects_sidewalk = Boolean(body.affects_sidewalk);
        const affects_roads = Boolean(body.affects_roads);
        const affects_bike_lanes = Boolean(body.affects_bike_lanes);
        if (!affects_sidewalk && !affects_roads && !affects_bike_lanes) {
            errors.push('Select at least one thing the closure affects (sidewalk, roads, or bike lanes).');
        }

        // optional location: only accepted when BOTH coords parse and are inside NYC
        const hasLat = typeof body.latitude === 'string' && body.latitude.trim().length > 0;
        const hasLon = typeof body.longitude === 'string' && body.longitude.trim().length > 0;
        if (hasLat !== hasLon) {
            errors.push('Location must include both latitude and longitude.');
        } else if (hasLat && hasLon) {
            try {
                closure_location = helpers.checkNycCoordinates(
                    Number(body.latitude),
                    Number(body.longitude)
                );
            } catch (e) {
                errors.push(String(e));
            }
        }

        if (errors.length > 0) {
            return renderReportPage(req, res, { errors, formData }, 400);
        }

        // create the closure -- reported_by comes from the session, never the body
        let closure;
        try {
            closure = await closuresData.createClosure(
                req.session.user._id,
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
        } catch (e) {
            return renderReportPage(req, res, { errors: [String(e)], formData }, 400);
        }

        // best-effort: users with matching saved streets get notified.
        // A notification failure must never fail the report itself.
        try {
            await notificationsData.notifyUsersForClosure(closure);
        } catch (e) {
            console.error('[POST /reportClosure] failed to create notifications:', e);
        }

        return renderReportPage(req, res, {
            success: true,
            closureId: closure._id.toString()
        });
    });

export default router;
