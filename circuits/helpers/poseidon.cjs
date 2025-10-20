const { buildEddsa, buildPoseidon } = require('circomlibjs');
let poseidon;

async function initializePoseidon() {
    poseidon = await buildPoseidon();
}

// Hash n field elements
async function hash(data) {
    console.log("hashing data: ", data);
    if (!poseidon) {
        await initializePoseidon();
    }
    const bytesResult = await poseidon(data);
    const bigIntHash = await poseidon.F.toObject(bytesResult);
    return bigIntHash;
}

module.exports = {
    hash
};