import express from 'express';
// import configureRoutes from './routes/index.js';

const app = express();
app.use(express.json());
// configureRoutes(app);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
