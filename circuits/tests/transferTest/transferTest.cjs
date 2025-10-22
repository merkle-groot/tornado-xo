const fs = require('fs');
const path = require("path");
const MerkleTree = require("../../helpers/fixedMerkleTree.cjs");
const { generateKeypair, sign, convertToPoseidonObject } = require("../../helpers/eddsa.cjs");
const { getCommitment } = require("../../helpers/desposit.cjs");
const { parseUnits } = require("../../helpers/utils.cjs");
const runBashScript = require("./runBash.cjs");

let merkleTree = null;
const keyPairs = [];
const commitmentsList = [];
const p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
const compileScript = "circuits/tests/transferTest/scripts/compile.sh"
const inputProcessingScript = "circuits/tests/transferTest/scripts/split-and-merge.sh"
const witnessScript = "circuits/tests/transferTest/scripts/witness-gen.sh"

const getRandomNumber = (min, max) => {
    return parseInt(Math.random() * (max - min) + min);
}


const init = async() => {
    merkleTree = new MerkleTree(4);
    await merkleTree.init();

    // add random keypairs
    for(let i=0; i<10; ++i){
        const keyPair = await generateKeypair(i.toString());
        keyPairs.push(keyPair);
    }
}

const createRandomCommitments = async(nos) => {
    for(let i=0; i<nos; ++i){
        // select a random keypair
        const keyPairIndex = getRandomNumber(0, 10);
        const keyPair = keyPairs[keyPairIndex];
        
        const depositAmount = parseUnits(getRandomNumber(1, 1000000), 6);
        const nullifier = getRandomNumber(1, 1000000);
        const { commitment, nullifierHash } = await getCommitment(depositAmount, keyPair, nullifier);
        
        // insert to merkle tree
        await merkleTree.insert(commitment);

        commitmentsList.push({
            keyPair,
            depositAmount,
            nullifier,
            commitment, 
            nullifierHash
        });
    }
    await writeToJson('./testOutput/commitments.json', commitmentsList);
}

const runTransferMPC = async() => {
    const index = 6;
    const commitment = commitmentsList[index];
    const { isLeft, siblings } = merkleTree.getPath(index);
    const root = merkleTree.getRoot();
    const sentAmount = getRandomNumber(parseUnits(1, 6), commitment["depositAmount"]);
    const changeAmount = commitment["depositAmount"] - sentAmount; 
    const senderKeyPair = commitment["keyPair"];

    // hash transfer request; sender
    const signature = await sign(senderKeyPair["privateKeyBytes"], commitment["commitment"]);
    const signatureRField = [
        await convertToPoseidonObject(signature.R8[0]),
        await convertToPoseidonObject(signature.R8[1])
    ];

    // change commitment
    const changeNullifier = getRandomNumber(1, 100000);
    const { commitment: changeCommitment } = await getCommitment(changeAmount, senderKeyPair, changeNullifier);

    // Get a random receiver and create a commitment
    const recieverIndex = getRandomNumber(0, 10);
    const receiverKeyPair = keyPairs[recieverIndex];
    const sentNullifier = getRandomNumber(1, 100000);
    const { commitment: sentCommitment } = await getCommitment(sentAmount, receiverKeyPair, sentNullifier);
    

    const input1 = {
        "senderCommitment0": commitment["commitment"],
        "senderNullifierHash0": commitment["nullifierHash"],
        "senderNullfier0": BigInt(commitment["nullifier"].toString()),
        "amount": BigInt(commitment["depositAmount"]),
        "senderPub": [senderKeyPair["publicKey"][0], senderKeyPair["publicKey"][1]],
        "root": root,
        "merkleSiblings": siblings,
        "merkleSiblingIsLeft": isLeft,
        "signatureR": signatureRField,
        "signatureS": signature.S,
        "amountSent": BigInt(sentAmount),
        "amountChange": BigInt(changeAmount),
        "senderCommitment1": changeCommitment,
        "senderNullifier1": BigInt(changeNullifier)
    };

    const input2 = {
        "receiverCommitment0": sentCommitment,
        "receiverPub": [receiverKeyPair["publicKey"][0], receiverKeyPair["publicKey"][1]],
        "receiverNullifier0": BigInt(sentNullifier)
    }

    await writeToJson("./testOutput/input1.json", input1);
    await writeToJson("./testOutput/input2.json", input2);

    // split the input 1&2 to shares and merge them
    await runBashScript(inputProcessingScript);
    await runBashScript(witnessScript);
}

const writeToJson = async(fileName, content) => {
    const jsonString = JSON.stringify(content, (_, v) => typeof v === 'bigint' ? v.toString() : v, null, 2);

    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, jsonString, (err) => {
        if (err) {
            console.error('Error writing file:', err);
            reject(err);
        } else {
            console.log(`Data successfully written to ${fileName}`);
            resolve();
        }
    });
    });
    
}

(async() => {
    await runBashScript(compileScript);
    await init();
    await createRandomCommitments(10);
    await runTransferMPC();
})()