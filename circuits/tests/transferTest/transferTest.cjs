const chai = require("chai");
const path = require("path");
const wasm_tester = require("circom_tester").wasm;
const MerkleTree = require("../../helpers/fixedMerkleTree.cjs");
const { generateKeypair, sign, convertToPoseidonObject } = require("../../helpers/eddsa.cjs");
const { hash } = require("../../helpers/poseidon.cjs");
const { getCommitment } = require("../../helpers/desposit.cjs");
const { parseUnits } = require("../../helpers/utils.cjs");
const assert = chai.assert;

let circuit = null;
let merkleTree = null;
let aliceKeyPair = null;
let bobKeyPair = null;
let charlieKeyPair = null;
const p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;


const init = async() {
    circuit = await wasm_tester(path.join(__dirname, "../src/withdraw.circom"), {
        verbose: true,
        logs: true
    });
    commitmentTesterCircuit = await wasm_tester(path.join(__dirname, "../src/testCircuits/desposit.circom"));
    aliceKeyPair = await generateKeypair("1");
    bobKeyPair = await generateKeypair("2");
    merkleTree = new MerkleTree(4);
    await merkleTree.init();
}