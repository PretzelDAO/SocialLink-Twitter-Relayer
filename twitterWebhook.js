
const Twitter = require('twit');
const crypto = require('crypto');


const CONFIG = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
};

const twitterClient = new Twitter(CONFIG);

let exponentialBackoff = 1;

const Service = {
    tokenverify: (req, res) => {
        /* Handle crc_token. */
        const crcToken = req.query.crc_token;
        if (crcToken) {
            const responseToken = `sha256=${crypto.createHmac('sha256', CONFIG.consumer_secret).update(crcToken).digest('base64')}`;
            res.send(JSON.stringify({
                response_token: responseToken,
            }));
        }
    },
    incomingWebhook: (req, res) => {
        console.log(req.body);
        if (req.body.follow_events) {
            Service.computeFollowId(req.body.follow_events[0]);
        }
        res.sendStatus(200);
    },
    computeFollowId: (event) => {
        if (event.type !== 'follow') {
            return;
        } 
        const followedFromId = event.source.id;
        const followedFromName = event.source.name;
        const followedId = event.target.id;
        const followedName = event.target.name;
        console.log(`EVENT: ${followedFromName} (${followedFromId}) has followed ${followedName} (${followedId})`);
    },
    registerSubscribeWebhook: async function registerSubscribeWebhook() {
        console.log(process.env.WEBHOOK_URL);
        twitterClient.post('account_activity/all/Hackathon/webhooks', { url: `${process.env.WEBHOOK_URL}/webhook` }, (err, data) => {
            if (err) {
                console.log(`GET webhooks ERROR ${err} ${JSON.stringify(data)}`, 2);
                switch (err.message) {
                    case 'Too many resources already created.':
                        twitterClient.get('account_activity/all/Hackathon/webhooks', {}, (err2, data2) => {
                            if (err2) {
                                console.log(`GET webhooks ERROR: ${err2} ${data2}`, 4);
                                return;
                            }
                            if (data2.valid) {
                                console.log('webhook url already registered', 4);
                                return;
                            }
                            console.log('deleting invalid webhook url...', 4);

                            twitterClient.delete(`account_activity/all/Hackathon/webhooks/${data2[0].id}`, {}, (err3) => {
                                if (err3) {
                                    console.log(`DELETE webhooks ERROR: ${err3}`, 4);
                                    return;
                                }
                                setTimeout(() => Service.registerSubscribeWebhook(), 15000 * exponentialBackoff);
                                exponentialBackoff += 1;
                                console.log('webhook url deleted', 4);
                            });
                        });
                        break;
                    case 'Over capacity':
                        setTimeout(() => Service.registerSubscribeWebhook(), 15000 * exponentialBackoff);
                        exponentialBackoff += 1;
                        console.log(`Retry webhook registration with ${15000 * exponentialBackoff}ms delay`, 2);
                        break;
                    default:
                        console.error(`Generic webhook error: ${err}`);
                        break;
                }
            } else {
                console.log('webhook url registered, subscribing...', 2);
                twitterClient.post('account_activity/all/Hackathon/subscriptions', { webhook_id: data.id }, (err2) => {
                    if (err2) {
                        console.log('GET webhooks ERROR', err2, 4);
                        return;
                    }
                    console.log('webhook url registered', 2);
                });
            }
        });
    },
};


Service.registerSubscribeWebhook();

module.exports = Service;