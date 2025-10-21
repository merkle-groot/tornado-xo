const { buildEddsa, buildPoseidon } = require('circomlibjs');
let poseidon;

async function initializePoseidon() {
    poseidon = await buildPoseidon();
}

// Hash n field elements
async function hash(left, right) {
    console.log("hashing data: ", left, right);
    if (!poseidon) {
        await initializePoseidon();
    }
    const bytesResult = await poseidon([left, right]);
    const bigIntHash = await poseidon.F.toObject(bytesResult);
    return bigIntHash;
}

module.exports = hash;