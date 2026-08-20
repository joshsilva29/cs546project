import usersRoutes          from "./users.js";
import closuresRoutes       from "./closures.js";
import notificationsRoutes  from "./notifications.js";
import durationRoutes       from "./closureDuration.js";
import historyRoutes        from "./closureHistory.js";
import nearYouRoutes        from "./closureNearYou.js";
import searchRoutes         from "./closureSearch.js";
import navigationRoutes     from "./navigation.js";
import closureByOft from "./closureByOft.js"

const configureRoutes = (app) => {
    app.use('/users',         usersRoutes);
    app.use('/closures',      closuresRoutes);
    app.use('/notifications', notificationsRoutes);
    app.use(navigationRoutes);
    app.use(durationRoutes);
    app.use(historyRoutes);
    app.use(nearYouRoutes);
    app.use(searchRoutes);
    app.use(closureByOft);

    app.use('/{*splat}', (req, res) => {
        return res.status(404).render('error', {
            layout: 'home',
            error: 'Page Not Found',
            title: 'Error'
        })
    });
}

export default configureRoutes;
