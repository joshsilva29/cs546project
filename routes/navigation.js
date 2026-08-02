import { Router } from 'express';

const router = Router();

//can add routes to pages here

router.get('/search', async (req, res) => {
    return res.render("search");
});

router.get('/notifications', async (req, res) => {
    return res.render("notifications", {
        layout: 'home',
        css: 'notifications',
        title: 'Notifications'
    });
});

router.get('/savedStreets', async (req, res) => {
    return res.render("savedStreets", {
        layout: 'home',
        css: 'savedStreets',
        title: 'Saved Streets'
    });
});

export default router;