pragma circom 2.0.4;

include "../../../node_modules/circomlib/circuits/poseidon.circom";

template Commitment() {
    signal input amount;
    signal input pub[2];
    signal input nullifier;
    signal output commitment;

    component commitmentHasher = Poseidon(5);
    commitmentHasher.inputs[0] <== amount;
    commitmentHasher.inputs[1] <== 1337;
    commitmentHasher.inputs[2] <== pub[0];
    commitmentHasher.inputs[3] <== pub[1];
    commitmentHasher.inputs[4] <== nullifier;
    // check if commitment corresponds to this pub key and amount
    commitment <== commitmentHasher.out;
}

component main = Commitment();