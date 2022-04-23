const cors = require('cors');
const webhookrouter = require('./webhookrouter');

module.exports = (app) => {
    app.get('/', (req, res) => {
        console.log(`Route requested: ${req.route.path}`, 2);
        res.sendStatus(200);
    });
    app.use('/webhook', webhookrouter);
}

