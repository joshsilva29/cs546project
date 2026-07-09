import {Router} from 'express';
const router = Router();

//get duration of closure
router.get('/duration/:id', (req, res) => {
  return res.send(`GET request to http://localhost:3000/duration/${req.params.id}`);
});

//get history of closures on this street (street sent in body)
//
//not sure if this can be done with nyc open data
router.post('/history', (req, res) => {
  return res.send(`POST request to http://localhost:3000/history`);
});

//get closures near a current location (street sent in body)
router.post('/nearYou', (req, res) => {
  return res.send(`POST request to http://localhost:3000/nearYou`);
});

//get closures in or around a certain street (street sent in body)
router.post('/closureSearch', (req, res) => {
  return res.send(`POST request to http://localhost:3000/closureSearch`);
});


export default router;