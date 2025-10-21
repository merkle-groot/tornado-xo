const chai = require("chai");
const path = require("path");
const wasm_tester = require("circom_tester").wasm;
const MerkleTree = require("../helpers/fixedMerkleTree.cjs");
const { generateKeypair, sign, toField, verify, convertToPoseidonObject } = require("../helpers/eddsa.cjs");
const { hash } = require("../helpers/poseidon.cjs");
const { getCommitment } = require("../helpers/desposit.cjs");
const { parseUnits } = require("../helpers/utils.cjs");
const assert = chai.assert;

// Cache the circuit to avoid recompiling
let circuit = null;
let commitmentTesterCircuit = null;
let merkleTree = null;
let aliceKeyPair = null;
let bobKeyPair = null;

// Before all tests, compile the circuit once
before(async function() {
    this.timeout(100000);
    circuit = await wasm_tester(path.join(__dirname, "../src/withdraw.circom"), {
        verbose: true,
        logs: true
    });
    commitmentTesterCircuit = await wasm_tester(path.join(__dirname, "../src/testCircuits/desposit.circom"));
    aliceKeyPair = await generateKeypair("1");
    bobKeyPair = await generateKeypair("2");
    merkleTree = new MerkleTree(4);
    await merkleTree.init();
});

describe("Withdraw circuit test", function () {
    this.timeout(100000);

    it("Should output the right hash", async function () {
        const depositAmount = parseUnits(10, 6);
        const { commitment, nullifierHash } = await getCommitment(depositAmount, aliceKeyPair, 123456);
        console.log(commitment);

        const w = await commitmentTesterCircuit.calculateWitness({
            amount: depositAmount,
            pub: [aliceKeyPair["publicKey"][0], aliceKeyPair["publicKey"][1]],
            nullifier: 123456n,
        });
        await commitmentTesterCircuit.checkConstraints(w);
        assert.equal(w[1], commitment);
    });

    it("Should allow withdrawal", async function () {
        const depositAmount = parseUnits(10, 6);
        const withdrawalAmount = parseUnits(8, 6);
        const { commitment, nullifierHash } = await getCommitment(depositAmount, aliceKeyPair, 123456);
        // insert into merkle tree and get it's path
        await merkleTree.insert(commitment);
        const {isLeft, siblings} = merkleTree.getPath(0);
        const root = merkleTree.getRoot();

        // commitment for change utxo
        const { commitment: changeCommitment, nullifierHash: changeNullifierHash } = await getCommitment(depositAmount - withdrawalAmount, bobKeyPair, 42);

        // hash withdrawal request
        const signatureAlice = await sign(aliceKeyPair["privateKeyBytes"], commitment.toString());
        const signatureRField = [
            await convertToPoseidonObject(signatureAlice.R8[0]),
            await convertToPoseidonObject(signatureAlice.R8[1])
        ];
        
        const w = await circuit.calculateWitness({
            senderCommitment0: commitment,
            senderNullifierHash0: nullifierHash,
            senderNullfier0: 123456,
            amount: depositAmount,
            senderPub: [aliceKeyPair["publicKey"][0], aliceKeyPair["publicKey"][1]],
            root: root,
            merkleSiblings: siblings,
            merkleSiblingIsLeft: isLeft,
            signatureR: signatureRField,
            signatureS: signatureAlice.S,
            amountWithdrawal: withdrawalAmount,
            amountChange: depositAmount - withdrawalAmount,
            receiverCommitment0: changeCommitment,
            receiverPub: [bobKeyPair["publicKey"][0], bobKeyPair["publicKey"][1]],
            receiverNullifier0: 42
        });
        // should not fails
        await circuit.checkConstraints(w);
        // assert.equal(w[1], commitment);
    });

    it("Should fail for incorrect signature", async function () {
        const depositAmount = parseUnits(10, 6);
        const withdrawalAmount = parseUnits(8, 6);
        const { commitment, nullifierHash } = await getCommitment(depositAmount, aliceKeyPair, 123456);
        // insert into merkle tree and get it's path
        await merkleTree.insert(commitment);
        const {isLeft, siblings} = merkleTree.getPath(0);
        const root = merkleTree.getRoot();

        // commitment for change utxo
        const { commitment: changeCommitment, nullifierHash: changeNullifierHash } = await getCommitment(depositAmount - withdrawalAmount, bobKeyPair, 42);

        // hash withdrawal request
        const signatureAlice = await sign(aliceKeyPair["privateKeyBytes"], "0x1");
        const signatureRField = [
            await convertToPoseidonObject(signatureAlice.R8[0]),
            await convertToPoseidonObject(signatureAlice.R8[1])
        ];
        
        try {
            const w = await circuit.calculateWitness({
                senderCommitment0: commitment,
                senderNullifierHash0: nullifierHash,
                senderNullfier0: 123456,
                amount: depositAmount,
                senderPub: [aliceKeyPair["publicKey"][0], aliceKeyPair["publicKey"][1]],
                root: root,
                merkleSiblings: siblings,
                merkleSiblingIsLeft: isLeft,
                signatureR: signatureRField,
                signatureS: signatureAlice.S,
                amountWithdrawal: withdrawalAmount,
                amountChange: depositAmount - withdrawalAmount,
                receiverCommitment0: changeCommitment,
                receiverPub: [bobKeyPair["publicKey"][0], bobKeyPair["publicKey"][1]],
                receiverNullifier0: 42
            });
        } catch (error){
            // Expected behavior - circuit should fail with incorrect signature
            assert.isTrue(error.message.includes("Assert Failed") || error.message.includes("constraint"),
                        `Expected constraint violation error, but got: ${error.message}`);
        }
    });

    it("incorrect change amount", async function () {
        const depositAmount = parseUnits(10, 6);
        const withdrawalAmount = parseUnits(8, 6);
        const changeAmount = parseUnits(10, 6);
        const { commitment, nullifierHash } = await getCommitment(depositAmount, aliceKeyPair, 123456);
        // insert into merkle tree and get it's path
        await merkleTree.insert(commitment);
        const {isLeft, siblings} = merkleTree.getPath(0);
        const root = merkleTree.getRoot();

        // commitment for change utxo
        const { commitment: changeCommitment, nullifierHash: changeNullifierHash } = await getCommitment(changeAmount, bobKeyPair, 42);

        // hash withdrawal request
        const signatureAlice = await sign(aliceKeyPair["privateKeyBytes"], commitment.toString());
        const signatureRField = [
            await convertToPoseidonObject(signatureAlice.R8[0]),
            await convertToPoseidonObject(signatureAlice.R8[1])
        ];
        
        try {
            const w = await circuit.calculateWitness({
                senderCommitment0: commitment,
                senderNullifierHash0: nullifierHash,
                senderNullfier0: 123456,
                amount: depositAmount,
                senderPub: [aliceKeyPair["publicKey"][0], aliceKeyPair["publicKey"][1]],
                root: root,
                merkleSiblings: siblings,
                merkleSiblingIsLeft: isLeft,
                signatureR: signatureRField,
                signatureS: signatureAlice.S,
                amountWithdrawal: withdrawalAmount,
                amountChange: changeAmount,
                receiverCommitment0: changeCommitment,
                receiverPub: [bobKeyPair["publicKey"][0], bobKeyPair["publicKey"][1]],
                receiverNullifier0: 42
            });
        } catch (error){
            // Expected behavior - circuit should fail with incorrect signature
            assert.isTrue(error.message.includes("Assert Failed") || error.message.includes("constraint"),
                        `Expected constraint violation error, but got: ${error.message}`);
        }
    });
});