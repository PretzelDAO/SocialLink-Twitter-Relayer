const webhookrouter = require('./webhookrouter');
const lensRouter = require('./lensRouter');


module.exports = (app) => {
    app.get('/', (req, res) => {
        console.log(`Route requested: ${req.route.path}`, 2);
        res.sendStatus(200);
    });
    app.use('/webhook', webhookrouter);
    app.use('/lens', lensRouter);
}

