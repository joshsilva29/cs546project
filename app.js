import express from 'express';
import configureRoutes from './routes/index.js';
import { usersData, closuresData } from './data/index.js';
import exphbs from 'express-handlebars';

const app = express();

app.use('/public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.engine('handlebars', exphbs.engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

configureRoutes(app);

// Ensure database indexes exist before accepting requests.
await usersData.ensureUserIndexes(); // unique email
await closuresData.ensureClosureIndexes(); // text index for street lookups

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});