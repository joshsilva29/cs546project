import {Router} from 'express';
import {usersData} from '../data/index.js';
const router = Router();

router
  .route('/')
  .post(async (req, res) => {
    //create a new user (register)
    try {
      const {first_name, last_name, email, password} = req.body;
      const user = await usersData.createUser(first_name, last_name, email, password);
      return res.status(201).json(user);
    } catch (e) {
      return res.status(400).json({error: e});
    }
  });

router
  .route('/:id')
  .get(async (req, res) => {
    //get user from id
    try {
      const user = await usersData.getUserById(req.params.id);
      return res.json(user);
    } catch (e) {
      return res.status(404).json({error: e});
    }
  });

router
  .route('/user_places/:id')
  .get(async (req, res) => {
    //get all saved steets for a certain user
    try {
      const places = await usersData.getUserPlaces(req.params.id);
      return res.json(places);
    } catch (e) {
      return res.status(404).json({error: e});
    }
  });

router
  .route('/user_places/street/:id')
  .post(async (req, res) => {
    //add street to user's saved streets (user_places field)
    try {
      const {street} = req.body;
      const user = await usersData.addUserPlace(req.params.id, street);
      return res.json(user);
    } catch (e) {
      return res.status(400).json({error: e});
    }
  })
  .delete(async (req, res) => {
    //delete street to user's saved streets (user_places field)
    try {
      const {street} = req.body;
      const user = await usersData.removeUserPlace(req.params.id, street);
      return res.json(user);
    } catch (e) {
      return res.status(400).json({error: e});
    }
  });


  export default router;