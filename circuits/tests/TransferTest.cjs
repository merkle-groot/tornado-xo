const chai = require("chai");
const path = require("path");
const wasm_tester = require("circom_tester").wasm;
const MerkleTree = require("../helpers/fixedMerkleTree.cjs");
const { generateKeypair, sign, toField, verify, convertToPoseidonObject } = require("../helpers/eddsa.cjs");
const { hash } = require("../helpers/poseidon.cjs");
const assert = chai.assert;

// Cache the circuit to avoid recompiling
let circuit = null;
let merkleTree = new MerkleTree(32);

// Before all tests, compile the circuit once
before(async function() {
    this.timeout(100000);
    circuit = await wasm_tester(path.join(__dirname, "../src/transfer.circom"));

    aliceKeyPair = generateKeypair();
    bobKeyPair = generateKeypair();
    merkleTree.insert(0x1);
});

describe("isZero circuit test", function () {
    this.timeout(100000);

    it("Should test zero input", async function () {
        console.log(merkleTree.root());

        assert.equal(1, 1);
        // const w = await circuit.calculateWitness({in1: 0});
        // await circuit.checkConstraints(w);
        // assert.equal(w[1], 1); // out should be 1 when input is 0
    });
});