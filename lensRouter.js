const router = require('express').Router();

const { linkTwitter, processTwitterFollow } = require('./walletService')

router.post('/register', (req, res) => {
  const parsedBody = req.body;
  const profileId = parsedBody.profileId
  const code = parsedBody.code

  console.log(`Call on /lens/register with values id ${profileId} and code ${code}`);

  linkTwitter(profileId, code)

});



module.exports = router;