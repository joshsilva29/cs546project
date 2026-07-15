import express from 'express';
import configureRoutes from './routes/index.js';
import {usersData} from './data/index.js';

const app = express();
app.use(express.json());
configureRoutes(app);

// Ensure database indexes (e.g. unique email) exist before accepting requests.
await usersData.ensureUserIndexes();

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
