const ethers = require('ethers')
const SHARED_CONTRACT_ABI = require('./abis/SHARED_CONTRACT.json')
const LENSHUB_ABI = require('./abis/LENSHUB').ABI
const axios = require('axios');
require('dotenv').config()

CONTRACT_ADDRESSES = {
    mumbaiOfficial: {
        sharedAccount: '0x4BF0c7AD32Fd2d32089790a54485e23f5C7736C0',
        lensHub: '0x4BF0c7AD32Fd2d32089790a54485e23f5C7736C0' // not correct
    },
    mumbaiCustom: {
        sharedAccount: '0xe240C29dba4Cc71Bc1206093c4a8E1B216f7f7bb',
        lensHub: '0x03dE2c5Dd914a1D8F94D57741D531874D30F5299' // not correct
    }
}
const contractAddresses = CONTRACT_ADDRESSES['mumbaiCustom']

// WALLET STUFF
// use generate_wallet.js to generate a wallet
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
const signer = wallet.connect(provider)

console.log(`Wallet address: ${signer.address}`);

//  CONTRACTS
const sharedAccountContract = new ethers.Contract(contractAddresses['sharedAccount'], SHARED_CONTRACT_ABI, signer)
const lenseHubContract = new ethers.Contract(contractAddresses['lensHub'], LENSHUB_ABI, signer)


async function linkTwitter(profileId, code) {
    // technically we should do some verifcation here ...
    const twitterProfile = await attemptTwitterCodeExchange(code)

    // if (!!twitterProfile) {
    //     console.error('Could not retrieve twitter profile by code!')
    //     return false
    // }

    const twitterId = String(twitterProfile.id) // '1513514501236211712' 
    console.log(`Storing mapping for ${twitterProfile.name}, ${twitterId}.`)

    const tx = await sharedAccountContract.linkTwitter(twitterId, profileId, {
        // gasLimit: 1000000
    })

    try {
        console.log(`Storing TX has is: ${tx.hash}`)
        await tx.wait()
        return true
    } catch (error) {
        console.error("Couldn't store the mapping")
        return false
    }

    return false
}

async function processTwitterFollow(followingId, followedId) {

    followingId = String(followingId)
    followedId = String(followedId)

    // we know that the followingId has an acount connected to lens. Otherwise it wouldn't be tracked by our service
    // we need to check whether the followedId also has a connected id

    // first get lens profile id for the followedId from smart contract
    console.log('getting followedProfileId');
    const followedProfileId = await sharedAccountContract.twitterIdToProfileId(followedId)
    console.log('got followedProfileId', Number(followedProfileId));

    // if the profile id is 0, we know that the twitter account is not connected to lens
    // TODO make sure profile Ids cannot start at 0
    if (Number(followedProfileId) === 0) {
        console.warn('Twitter user is not connected to lens.')
        return false
    }


    // now find the lens profile of the person that followed
    // we know this person is connected to lense
    console.log('getting followingProfileId');
    const followingProfileId = await sharedAccountContract.twitterIdToProfileId(followingId)
    console.log('got followingProfileId', Number(followingProfileId));

    // let's get the address of the followingProfile
    // i.e. the owner of the profileNFT
    console.log('getting the owner');
    const address = await lenseHubContract.ownerOf(followingProfileId)
    console.log('the owner is', address);


    // then call followOnBehalf 
    const tx = await sharedAccountContract.followOnBehalf(address, [followedProfileId], [[]], {
        gasLimit: 1000000
    })
    console.log(tx.hash)
    await tx.wait()
}




async function attemptTwitterCodeExchange(code) {
    try {
        console.log('params:', {
            grant_type: 'authorization_code',
            client_id: process.env.TWITTER_CLIENT_ID,
            redirect_uri: process.env.FRONTEND_URL,
            code_verifier: 'challenger',
            code: code,
        });

        //exchange code for tokens, ref: https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token
        var auth_result = await axios.post(
            'https://api.twitter.com/2/oauth2/token',
            null,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization:
                        'Basic ' +
                        Buffer.from(
                            process.env.TWITTER_CLIENT_ID +
                            ':' +
                            process.env.TWITTER_CLIENT_SECRET
                        ).toString('base64'),
                },
                params: {
                    grant_type: 'authorization_code',
                    client_id: process.env.TWITTER_CLIENT_ID,
                    redirect_uri: process.env.FRONTEND_URL,
                    code_verifier: 'challenger',
                    code: code,
                },
            }
        );

        //save tokens
        // console.log('RES', auth_result.data);
        const access_token = auth_result.data.access_token;
        const refresh_token = auth_result.data.refresh_token;

        //use tokens to verify user name
        var twitter_me = await axios.get('https://api.twitter.com/2/users/me', {
            headers: {
                Authorization: 'Bearer ' + access_token,
            },
        });
        // console.log(
        //     'twitter me', twitter_me.data?.data,
        //     twitter_me.data?.data?.id,
        //     twitter_me.data?.data?.username
        // );
        return twitter_me.data?.data
    } catch (e) {
        console.error(
            'FAILED getting token',
            e.message,
            e.response?.data.error_description
            // e.request
        );
    }
    return null;
}

async function test() {
    // const balance = await signer.getBalance()
    // console.log(`Balance: ${balance}`);

    // const lenseHubContract = new ethers.Contract(contractAddresses['lensHub'], LENSHUB_ABI, signer)
    // const o = await lenseHubContract.ownerOf(1)
    // console.log(o);

    // const code = 'dTNYZkxpSi1CMjJZWkxRbEM0eEVkMnZzelc2YWg0aDlHWjE0cXlnbHdZSS1DOjE2NTA3Mjk3Njk5NjI6MTowOmFjOjE'
    // attemptTwitterCodeExchange(code)


    // 1513514501236211712
    linkTwitter(3, 'code')

}


// test()


module.exports = {
    linkTwitter,
    processTwitterFollow
}