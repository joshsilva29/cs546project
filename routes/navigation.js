import { Router } from 'express';

const router = Router();

//can add routes to pages here

router.get('/search', async (req, res) => {
    return res.render("search");
});

router.get('/home', async (req, res) => {
    return res.render("home");
});

export default router;