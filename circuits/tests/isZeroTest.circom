const chai = require("chai");
const path = require("path");
const wasm_tester = require("circom_tester").wasm;
const assert = chai.assert;

// Cache the circuit to avoid recompiling
let circuit = null;

// Before all tests, compile the circuit once
before(async function() {
    this.timeout(100000);
    circuit = await wasm_tester(path.join(__dirname, "../src/isZero.circom"));
});

describe("isZero circuit test", function () {
    this.timeout(100000);

    it("Should test zero input", async function () {
        const w = await circuit.calculateWitness({in1: 0});
        await circuit.checkConstraints(w);
        assert.equal(w[1], 1); // out should be 1 when input is 0
    });

    it("Should test non-zero input", async function () {
        const w = await circuit.calculateWitness({in1: 5});
        await circuit.checkConstraints(w);
        assert.equal(w[1], 0); // out should be 0 when input is non-zero
    });

    it("Should test multiple non-zero inputs", async function () {
        // Test with 1
        const w1 = await circuit.calculateWitness({in1: 1});
        await circuit.checkConstraints(w1);
        assert.equal(w1[1], 0);

        // Test with large number
        const w2 = await circuit.calculateWitness({in1: 123456789});
        await circuit.checkConstraints(w2);
        assert.equal(w2[1], 0);
    });
});