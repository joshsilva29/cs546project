import express from 'express';
import configureRoutes from './routes/index.js';
import { usersData, closuresData } from './data/index.js';
import exphbs from 'express-handlebars';
import session from 'express-session';

const app = express();

app.use('/public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(session({
  name: 'LoginState',
  secret: 'some secret string!',
  resave: false,
  saveUninitialized: false
}));

//middleware if not logged in
app.use("/notifications", (req, res, next) => {
     let method = req.method;
     if (!req.session.user && method === "GET") {
        return res.redirect("/users/login");
     } else {
        next();
     }
});

app.use("/savedStreets", (req, res, next) => {
     let method = req.method;
     if (!req.session.user && method === "GET") {
        return res.redirect("/users/login");
     } else {
        next();
     }
});

app.use("/reportClosure", (req, res, next) => {
     let method = req.method;
     if (!req.session.user && method === "GET") {
        return res.redirect("/users/login");
     } else {
        next();
     }
});


app.engine('handlebars', exphbs.engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

configureRoutes(app);

// Ensure database indexes exist before accepting requests.
await usersData.ensureUserIndexes(); // unique email
await closuresData.ensureClosureIndexes(); // text index for street lookups

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});