import usersRoutes          from "./users.js";
import nycClosuresRoutes    from "./nycClosures.js";
import reportClosureRoutes  from "./reportClosure.js";
import durationRoutes       from "./closureDuration.js";
import historyRoutes        from "./closureHistory.js";
import nearYouRoutes        from "./closureNearYou.js";
import searchRoutes         from "./closureSearch.js";

const configureRoutes = (app) => {
    app.use('/users',       usersRoutes);
    app.use('/nycClosures', nycClosuresRoutes);
    app.use(reportClosureRoutes);
    app.use(durationRoutes);
    app.use(historyRoutes);
    app.use(nearYouRoutes);
    app.use(searchRoutes);

    app.use('/{*splat}', (req, res) => {
        return res.status(404).json({ error: 'Not found' });
    });
}

export default configureRoutes;