const router = require('express').Router();

const { linkTwitter, processTwitterFollow } = require('./walletService')

router.post('/register', async (req, res) => {
  const parsedBody = req.body;
  const profileId = parsedBody.profileId
  const code = parsedBody.code

  console.log(`Call on /lens/register with values id ${profileId} and code ${code}`);

  const a = await linkTwitter(profileId, code)
  console.log(a);
  if (a) {
    res.sendStatus(200)
  } else {
    res.sendStatus(500)
  }
});



module.exports = router;