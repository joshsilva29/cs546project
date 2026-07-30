import { Router } from "express";

const router = Router();

router 
  .route('/')
  .get( async (req, res) => {
    try {
      return res.render('home', { title: 'Home Page'});
    } catch (e) {
      return res.status(400).json({ error: e });
    }
  });

export default router;