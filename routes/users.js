import {Router} from 'express';
const router = Router();

router
  .route('/:id')
  .get(async (req, res) => {
    //get user from id
    return res.send(`GET request to http://localhost:3000/users/${req.params.id}`);
  });

router
  .route('/user_places/:id')
  .get(async (req, res) => {
    //get all saved steets for a certain user
    return res.send(`POST request to http://localhost:3000/users/user_places/${req.params.id}`);
  });

router
  .route('/user_places/street/:id')
  .post(async (req, res) => {
    //add street to user's saved streets (user_places field)
    return res.send(`POST request to http://localhost:3000/users/user_places/street/${req.params.id}`);
  })
  .delete(async (req, res) => {
    //delete street to user's saved streets (user_places field)
    return res.send(`DELETE request to http://localhost:3000/users/user_places/street/${req.params.id}`);
  });


  export default router;