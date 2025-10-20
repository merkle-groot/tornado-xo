const { buildEddsa, buildPoseidon } = require('circomlibjs');

let poseidon;
let eddsa;

async function initializeEddsa(){
    eddsa = await buildEddsa();
}

async function initializePoseidon() {
    poseidon = await buildPoseidon();
}

function toField(data) {
    return eddsa.F.e(data);
}

// Hash n field elements
async function hash(data) {
    if (!poseidon) {
        await initializePoseidon();
    }
    const bytesResult = await poseidon(data);
    const bigIntHash = await poseidon.F.toObject(bytesResult);
    return bigIntHash;
}

async function convertToPoseidonObject(bytesArray) {
    if (!poseidon) {
        await initializePoseidon();
    }
    return poseidon.F.toObject(bytesArray);
}

async function generateKeypair(seed) {
    console.log("Generating deterministic BabyJubJub keypair...", seed);
    if (!eddsa) {
        await initializeEddsa();
    }

    // Create a proper 32-byte private key from seed
    const seedBuffer = Buffer.from(seed, 'utf8');
    const privateKeyBuffer = Buffer.alloc(32);
    seedBuffer.copy(privateKeyBuffer);
    const privateKeyBytes = Array.from(privateKeyBuffer);

    // Derive public key from private key
    const publicKeyBytes = eddsa.prv2pub(privateKeyBytes);

    const privateKey = BigInt("0x" + Buffer.from(privateKeyBytes).toString('hex'));
    const publicKey = [eddsa.F.toObject(publicKeyBytes[0]), eddsa.F.toObject(publicKeyBytes[1])];
    // console.log("privateKey:", privateKey);
    // console.log("publicKey:", publicKey);

    return {
        privateKeyBytes: privateKeyBytes,
        publicKeyBytes: publicKeyBytes,
        privateKey: privateKey,
        publicKey: publicKey
    };
}

async function sign(privateKey, message) {
    if (!eddsa) {
        await initializeEddsa();
    }
    // Convert message to proper format - it needs to be a field element
    const msgField = eddsa.F.e(message);
    const result = await eddsa.signPoseidon(privateKey, msgField);
    // console.log("Signing with message field:", msgField);
    // console.log("Generated signature:", result);
    return result;
}

async function verify(msgField, signature, publicKey) {
    return await eddsa.verifyPoseidon(msgField, signature, publicKey);
}

module.exports = {
    toField,
    hash,
    generateKeypair,
    sign,
    verify,
    convertToPoseidonObject
}
