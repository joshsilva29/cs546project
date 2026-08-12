import { Router } from 'express';
import * as users from '../data/users.js'; 
import * as helpers from '../helpers.js';

const router = Router();

//can add routes to pages here

router.get('/search', async (req, res) => {
    return res.render("search", {
        layout: 'home',
        css: 'search',
        title: 'Search'
    });
});

router.get('/notifications', async (req, res) => {
    return res.render("notifications", {
        layout: 'home',
        css: 'notifications',
        title: 'Notifications'
    });
});

router.route('/savedStreets')
    .get(async (req, res) => {
        let savedStreets;

        try {
            const id = 'EXAMPLE_ID'; // get id from log in user
            savedStreets = await users.getUserPlaces(id);
            return res.render("savedStreets", {
                layout: 'home',
                css: 'savedStreets',
                title: 'Saved Streets',
                savedStreets
            });
        } catch (e) {
            return res.status(500).render("error", {
                layout: 'home',
                title: "Error",
                error: e
            });
        }
    })
    .post(async (req, res) => {
        let street; 
        let id;
        try {
            id = helpers.checkId('EXAMPLE_ID'); // get id from logged in user
            const reqBody = req.body;
            street = helpers.checkStreet(reqBody.street);
        } catch (e) {
            return res.status(400).render("error", {
                layout: 'home',
                title: "Error",
                error: e
            });
        }

        try {
            await users.addUserPlace(id, street);
        } catch (e) {
            return res.status(404).render("error", {
                layout: 'home',
                title: "Error",
                error: e
            });
        }
        
    });

router.get('/nearbyClosures', async (req, res) => {
    return res.render("nearbyClosures", {
        layout: 'home',
        css: 'nearbyClosures',
        title: 'Nearby Closures'
    });
});

router.get('/reportClosure', async (req, res) => {
    return res.render("reportClosure", {
        layout: 'home',
        css: 'reportClosure',
        title: 'Report Closure'
    });
});

export default router;