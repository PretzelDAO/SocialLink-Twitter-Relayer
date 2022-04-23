const ethers = require('ethers')

const wallet = ethers.Wallet.createRandom()

console.log(`New wallet address: ${wallet.address}`);
console.log(`New wallet private mnemonic: ${wallet.mnemonic.phrase}`);