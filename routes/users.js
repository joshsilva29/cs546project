import {Router} from 'express';
import {usersData} from '../data/index.js';
import * as helpers from "../helpers.js";
const router = Router();

//josh (frontend integration) -- load register page for user
router
  .route('/')
  .get(async (req, res) => {
    //render register page
    return res.render("register", {
        layout: 'home',
        css: 'register',
        title: 'Register',
        loggedIn: req.session.user ? true : false
    });
  });

router
  .route('/')
  .post(async (req, res) => {
    //create a new user (register)

    //check for missing fields
    let missingFields = [];
    try {
      if (!req.body) throw "All fields are missing.";
      if (!req.body.first_name) missingFields.push("First Name");
      if (!req.body.last_name) missingFields.push("Last Name");
      if (!req.body.email) missingFields.push("Email");
      if (!req.body.password) missingFields.push("Password");

      if (missingFields.length !== 0) throw "There are missing fields.";
    } catch (e) {
      return res.render("register", {
        layout: 'home',
        css: 'register',
        title: 'Register',
        loggedIn: req.session.user ? true : false,
        serverError: true,
        error: e,
        hasMissingFields: true,
        missingFields: missingFields
      });
    }

    //actual data function call
    try {
      let {first_name, last_name, email, password} = req.body;
      first_name = helpers.checkString(first_name, "First Name");
      last_name = helpers.checkString(last_name, "Last Name");
      email = helpers.checkEmail(email, "Email");
      password = helpers.checkString(password, "Password");

      const user = await usersData.createUser(first_name, last_name, email, password);
      return res.redirect("/users/login");
    } catch (e) {
      return res.render("register", {
        layout: 'home',
        css: 'register',
        title: 'Register',
        loggedIn: req.session.user ? true : false,
        serverError: true,
        error: e,
        hasMissingFields: false
      });
    }
  });

//josh (frontend integration) -- login routes
router
  .route('/login')
  .get(async (req, res) => {
    //code here for GET
    return res.render("login", {
      layout: 'home',
      css: 'login',
      title: 'Login',
      loggedIn: req.session.user ? true : false
    });
  })
  .post(async (req, res) => {
    //code here for POST

    //check for missing fields
    let missingFields = [];
    try {
      if (!req.body) throw "All fields are missing.";
      if (!req.body.email) missingFields.push("Email");
      if (!req.body.password) missingFields.push("Password");

      if (missingFields.length !== 0) throw "There are missing fields.";
    } catch (e) {
      return res.render("login", {
        layout: 'home',
        css: 'register',
        title: 'Register',
        loggedIn: req.session.user ? true : false,
        serverError: true,
        error: e,
        hasMissingFields: true,
        missingFields: missingFields
      });
    }

    try {
        req.body.email = helpers.checkEmail(req.body.email, "Email");
        req.body.password = helpers.checkString(req.body.password, "Password");
        let user = await usersData.authenticateUser(req.body.email, req.body.password);
        req.session.user = user;
        return res.redirect('/nearbyClosures');
    } catch (e) {
        return res.render("login", {
          layout: 'home',
          css: 'login',
          title: 'login',
          loggedIn: req.session.user ? true : false,
          serverError: true,
          error: e,
          hasMissingFields: false
      });
    }
  });


//josh - logout
router.route('/logout').get(async (req, res) => {
  //code here for GET
  req.session.destroy();
  return res.render("logout", {
        layout: 'home',
        css: 'logout',
        title: 'Logout'
    });
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