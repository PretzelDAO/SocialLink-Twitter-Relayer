const router = require('express').Router();
// For Verification
const crypto = require('crypto');

const twitterInterface = require('./twitterWebhook');

const twitterSigVerify = (req) => {
  const twitterSignature = req.headers['x-twitter-webhooks-signature'];
  console.log(`From Twitter: ${twitterSignature}`, 4);
  const parsedBody = req.body;
  const requestBody = req.rawBody;

  let timestamp = null;
  /* if (parsedBody.tweet_create_events) {
    timestamp = parsedBody.tweet_create_events[0].timestamp_ms;
  } else if (parsedBody.favorite_events) {
    timestamp = parsedBody.favorite_events[0].timestamp_ms;
  } else if (parsedBody.direct_message_events) {
    timestamp = parsedBody.direct_message_events[0].created_timestamp;
  } else if (parsedBody.direct_message_indicate_typing_events) {
    timestamp = parsedBody.direct_message_indicate_typing_events[0].created_timestamp;
  } else if (parsedBody.tweet_delete_events) {
    timestamp = parsedBody.tweet_delete_events[0].timestamp_ms;
  } else if (parsedBody.block_events) {
    timestamp = parsedBody.block_events[0].created_timestamp;
  } else if (parsedBody.user_event) {
    console.error(`!ACCESS REVOKED!: ${JSON.stringify(parsedBody)}`);
    return false;
  } else {
    console.log(`Unkown Request in webhook: ${JSON.stringify(parsedBody)}`, 4);
    return false;
  } */

  if (!twitterSignature || !requestBody || !timestamp) {
    console.error(`FAIL Headers: ${JSON.stringify(req.headers)} body: ${JSON.stringify(req.body)}`);
    return false;
  }

  if (Number.isNaN(timestamp, 10)) {
    console.error('timestamp is not a number');
    return false;
  }
  /* const time = new Date().getTime();
  if (Math.abs(time - timestamp) > 5500 || timestamp > time) {
    console.error(`Someone tried to break into twitter. Timestamp doesnt match: ${time} :: ${timestamp}`);
    return false;
  } */

  const correctSignature = crypto.createHmac('sha256', process.env.CONSUMER_SECRET).update(requestBody).digest('base64');
  const base64Signature = `sha256=${correctSignature}`;

  let signaturesMatch = false;
  try {
    signaturesMatch = crypto.timingSafeEqual(Buffer.from(base64Signature, 'base64'), Buffer.from(twitterSignature, 'base64'));
  } catch (e) {
    console.error(`Someone tried to break into twitter. Headers: ${JSON.stringify(req.headers)} body: ${JSON.stringify(req.body)} Error: ${e}`);
  }

  console.log(`Hash1: ${base64Signature}\nHash2: ${twitterSignature}\nMatch: ${signaturesMatch}`, 4);

  if (signaturesMatch === true) {
    return true;
  }
  return false;
};

router.get('/', (req, res) => {
  twitterInterface.tokenverify(req, res);
});

router.post('/', (req, res) => {
  /* if (twitterSigVerify(req) !== true) {
    res.sendStatus(403);
    return;
  } */

  twitterInterface.incomingWebhook(req, res);
});

module.exports = router;