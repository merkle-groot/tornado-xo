pragma circom 2.0.4;

template NullifierChecker() {
    signal input nullifier;
    signal input nullifierHash;

    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    // check if provided hash matches the nullifier hash
    nullifierHash === nullifierHasher.out;
}

template CommitmentChecker() {
    signal input amount;
    signal input pub[2];
    signal input nullifier;
    signal input commitment;

    component commitmentHasher = Poseidon(5);
    commitmentHasher.inputs[0] <== amount;
    commitmentHasher.inputs[1] <== 1337;
    commitmentHasher.inputs[2] <== pub[0];
    commitmentHasher.inputs[3] <== pub[1];
    commitmentHasher.inputs[4] <== nullifier;
    // check if commitment corresponds to this pub key and amount
    commitment === commitmentHasher.out;
}