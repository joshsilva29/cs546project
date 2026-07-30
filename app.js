import express from 'express';
import configureRoutes from './routes/index.js';
import { usersData, closuresData } from './data/index.js';
import exphbs from 'express-handlebars';

const app = express();

const rewriteUnsupportedBrowserMethods = (req, res, next) => {
  // If the user posts to the server with a property called _method, rewrite the request's method
  // To be that method; so if they post _method=PUT you can now allow browsers to POST to a route that gets
  // rewritten in this middleware to a PUT route
  if (req.body && req.body._method) {
    req.method = req.body._method;
    delete req.body._method;
  }

  // let the next middleware run:
  next();
};

app.use('/public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rewriteUnsupportedBrowserMethods);
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

configureRoutes(app);

// Ensure database indexes exist before accepting requests.
await usersData.ensureUserIndexes(); // unique email
await closuresData.ensureClosureIndexes(); // text index for street lookups

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});