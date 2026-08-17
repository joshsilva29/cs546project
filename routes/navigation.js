import { Router } from 'express';

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

router.get('/savedStreets', async (req, res) => {
    return res.render("savedStreets", {
        layout: 'home',
        css: 'savedStreets',
        title: 'Saved Streets',
        loggedIn: req.session.user ? true : false
    });
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
        loggedIn: req.session.user ? true : false,
        userId: req.session.user ? req.session.user._id : null
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