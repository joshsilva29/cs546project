import express from 'express';
import configureRoutes from './routes/index.js';
import { usersData, closuresData } from './data/index.js';

const app = express();
app.use(express.json());
configureRoutes(app);

// Ensure database indexes exist before accepting requests.
await usersData.ensureUserIndexes(); // unique email
await closuresData.ensureClosureIndexes(); // text index for street lookups

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});