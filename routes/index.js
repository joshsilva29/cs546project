import usersRoutes from "./users.js";
import closuresRoutes from "./closures.js";
import nycClosuresRoutes from "./nycClosures.js";

const configureRoutes = (app) => {
    app.use('/users', usersRoutes);
    app.use('/closures', closuresRoutes);
    app.use('/nycClosures', nycClosuresRoutes);

    app.use('/{*splat}', (req, res) => {
        return res.status(404).json({error: 'Not found'});
    });
}

export default configureRoutes;