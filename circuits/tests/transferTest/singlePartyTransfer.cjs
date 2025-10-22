const path = require("path");
const wasm_tester = require("circom_tester").wasm;
const MerkleTree = require("../../helpers/fixedMerkleTree.cjs");
const { generateKeypair, sign, convertToPoseidonObject } = require("../../helpers/eddsa.cjs");
const { getCommitment } = require("../../helpers/desposit.cjs");
const { parseUnits } = require("../../helpers/utils.cjs");

// Cache the circuit to avoid recompiling
let circuit = null;
let merkleTree = null;
let aliceKeyPair = null;
let bobKeyPair = null;
const p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

// Before all tests, compile the circuit once
before(async function() {
    this.timeout(100000);
    circuit = await wasm_tester(path.join(__dirname, "../../src/transfer.circom"), {
        verbose: true,
        logs: true
    });
    commitmentTesterCircuit = await wasm_tester(path.join(__dirname, "../../src/testCircuits/desposit.circom"));
    aliceKeyPair = await generateKeypair("1");
    bobKeyPair = await generateKeypair("2");
    merkleTree = new MerkleTree(4);
    await merkleTree.init();
});

describe("transfer circuit test", function () {
    this.timeout(100000);
    let workingParams = null;

    before(async function() {
        const depositAmount = parseUnits(17, 6);
        const sentAmount = parseUnits(8, 6);
        const changeAmount = parseUnits(9, 6);
        const nullifier = 123456n;
        const { commitment, nullifierHash } = await getCommitment(depositAmount, aliceKeyPair, nullifier);
        
        // insert into merkle tree and get it's path
        await merkleTree.insert(commitment);
        const {isLeft, siblings} = merkleTree.getPath(0);
        const root = merkleTree.getRoot();

        // commitment for sent utxo
        const sentNullifier = 67n;
        const { commitment: sentCommitment, nullifierHash: sentNullifierHash } = await getCommitment(sentAmount, bobKeyPair, sentNullifier);

        // commitment for change utxo
        const changeNullifier = 42n;
        const { commitment: changeCommitment, nullifierHash: changeNullifierHash } = await getCommitment(changeAmount, aliceKeyPair, changeNullifier);

        // hash withdrawal request
        const signatureAlice = await sign(aliceKeyPair["privateKeyBytes"], commitment.toString());
        const signatureRField = [
            await convertToPoseidonObject(signatureAlice.R8[0]),
            await convertToPoseidonObject(signatureAlice.R8[1])
        ];
    
        workingParams = {
            senderCommitment0: commitment,
            senderNullifierHash0: nullifierHash,
            senderNullfier0: nullifier,
            amount: depositAmount,
            senderPub: [aliceKeyPair["publicKey"][0], aliceKeyPair["publicKey"][1]],
            root: root,
            merkleSiblings: siblings,
            merkleSiblingIsLeft: isLeft,
            signatureR: signatureRField,
            signatureS: signatureAlice.S,
            amountSent: sentAmount,
            amountChange: changeAmount,
            senderCommitment1: changeCommitment,
            senderNullifier1: changeNullifier,
            receiverCommitment0: sentCommitment,
            receiverPub: [bobKeyPair["publicKey"][0], bobKeyPair["publicKey"][1]],
            receiverNullifier0: sentNullifier
        };
    });

    it("Should allow tranfer", async function () {
        const w = await circuit.calculateWitness(workingParams);
        // should not fail
        await circuit.checkConstraints(w);
        // assert.equal(w[1], commitment);
    });
});