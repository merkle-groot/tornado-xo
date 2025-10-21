const { hashN } = require('./poseidon.cjs');

async function getCommitment(amount, keypair, nullifier) {
    const commitment = await hashN(
        [
            BigInt(amount), 
            1337n,
            keypair["publicKey"][0], 
            keypair["publicKey"][1], 
            BigInt(nullifier)
        ]
    );

    const nullifierHash = await hashN(
        [
            BigInt(nullifier)
        ]
    )
    return {
        commitment,
        nullifierHash
    }

}

module.exports = {
    getCommitment
};