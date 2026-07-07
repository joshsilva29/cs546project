import {Router} from 'express';
const router = Router();

router
  .route('/')
  .get(async (req, res) => {
    return res.send('POST request to http://localhost:3000/nycClosures');
  })
  .post(async (req, res) => {
    return res.send('POST request to http://localhost:3000/nycClosures');
  })
  .delete(async (req, res) => {
    return res.send('DELETE request to http://localhost:3000/nycClosures');
  })
  .put(async (req, res) => {
    return res.send('PUT request to http://localhost:3000/nycClosures');
  })
  .patch(async (req, res) => {
    return res.send('PATCH request to http://localhost:3000/nycClosures');
  });

export default router;