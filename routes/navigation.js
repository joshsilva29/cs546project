import { Router } from 'express';
import * as users from '../data/users.js'; 
import * as helpers from '../helpers.js';

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

router.get('/notifications', async (req, res) => {
    return res.render("notifications", {
        layout: 'home',
        css: 'notifications',
        title: 'Notifications',
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

router.get('/nycClosureDetail/:oftcode', async (req, res) => {
    return res.render("nycClosureDetail", {
        layout: 'home',
        css: 'nycClosureDetail',
        title: 'Closure Details',
        loggedIn: req.session.user ? true : false,
        oftcode: req.params.oftcode
    });
});

export default router;