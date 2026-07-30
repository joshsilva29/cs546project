import { Router } from 'express';

const router = Router();

//can add routes to pages here

router.get('/search', async (req, res) => {
    return res.render("search");
});

export default router;