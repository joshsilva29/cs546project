import {Router} from 'express';
const router = Router();

router
  .route('/')
  .get(async (req, res) => {
    return res.send('POST request to http://localhost:3000/users');
  })
  .post(async (req, res) => {
    return res.send('POST request to http://localhost:3000/users');
  })
  .delete(async (req, res) => {
    return res.send('POST request to http://localhost:3000/users');
  })
  .put(async (req, res) => {
    return res.send('POST request to http://localhost:3000/users');
  })
  .patch(async (req, res) => {
    return res.send('POST request to http://localhost:3000/users');
  });

  export default router;