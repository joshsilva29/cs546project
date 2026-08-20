import { Router } from 'express';
import * as users from '../data/users.js';
import * as closures from '../data/closures.js';
import * as helpers from '../helpers.js';
import xss from 'xss';

const router = Router();

//can add routes to pages here

router.get('/search', async (req, res) => {
    return res.render("search", {
        layout: 'home',
        css: 'search',
        title: 'Search',
        loggedIn: req.session.user ? true : false
    });
});

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

router.get('/notifications', async (req, res) => {
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
            street = helpers.checkStreet(xss(reqBody.save_street_input));
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
    })
    .delete(async (req, res) => {
        let street, id;

        try {
            id = helpers.checkId(req.session.user._id); // get id from logged in user
            const reqBody = req.body;
            street = helpers.checkStreet(xss(reqBody.street));
        } catch (e) {
            return res.status(400).render("error", {
                layout: 'home',
                title: "Error",
                error: e,
                loggedIn: req.session.user ? true : false
            });
        }

        try {
            const deletedStreet = await users.removeUserPlace(id, street);
            return res.json(deletedStreet);
        } catch (e) {
            return res.status(400).json({error: e});
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

router.get('/reportClosure', async (req, res) => {
    return res.render("reportClosure", {
        layout: 'home',
        css: 'reportClosure',
        title: 'Report Closure',
        loggedIn: req.session.user ? true : false
    });
});

router.get('/userReportedClosures', async (req, res) => {
    return res.render("userReportedClosures", {
        layout: 'home',
        css: 'userReportedClosures',
        title: 'User-Reported Closures',
        loggedIn: req.session.user ? true : false
    });
});

router.get('/nycClosures', async (req, res) => {
    return res.render("nycClosures", {
        layout: 'home',
        css: 'nycClosures',
        title: 'NYC Open Data Closures',
        loggedIn: req.session.user ? true : false
    });
});

router.get('/closureDetail/:id', async (req, res) => {
    return res.render("closureDetail", {
        layout: 'home',
        css: 'closureDetail',
        title: 'Closure Details',
        loggedIn: req.session.user ? true : false,
        userId: req.session.user ? req.session.user._id : null,
        closureId: req.params.id
    });
});

router.get('/nycClosureDetail/:oftcode/:startDate/:endDate', async (req, res) => {
        req.params.oftcode = xss(req.params.oftcode);
        req.params.startDate = xss(req.params.startDate);
        req.params.endDate = xss(req.params.endDate);

        //check dates
        try {
            helpers.checkDate(decodeURIComponent(req.params.startDate), "Start date");
            helpers.checkDate(decodeURIComponent(req.params.endDate), "End date");
            return res.render("nycClosureDetail", {
                layout: 'home',
                css: 'nycClosureDetail',
                title: 'Closure Details',
                loggedIn: req.session.user ? true : false,
                oftcode: req.params.oftcode,
                startDate: req.params.startDate,
                endDate: req.params.endDate
            });
        } catch (e) {
            return res.status(400).render("error", {
                layout: 'home',
                title: "Error",
                error: e,
                loggedIn: req.session.user ? true : false
            });
        }
});

export default router;