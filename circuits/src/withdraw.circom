pragma circom 2.0.4;

include "../../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/sign.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "./merkleChecker.circom";
include "./commitmentChecker.circom";
include "./getSign.circom";

template Withdraw(n) {
    /////////////
    // Signals //
    /////////////

    // sender
    // prove existence of commitment
    signal input senderCommitment0;
    signal input senderNullifierHash0;
    signal input senderNullfier0;

    // commitment components
    signal input amount;
    signal input senderPub[2];

    // merkle proof
    signal input root;
    signal input merkleSiblings[n];
    signal input merkleSiblingIsLeft[n];

    // signature
    signal input signatureR[2];
    signal input signatureS;

    // transfer
    signal input amountWithdrawal;
    signal input amountChange;

    // receiver 
    signal input receiverCommitment0;
    signal input receiverPub[2];
    signal input receiverNullifier0;

    signal output isValid;

    /////////////////////
    // Signature Check //
    /////////////////////
    
    // proof fails if not valid
    component signatureVerifier = EdDSAPoseidonVerifier();
    signatureVerifier.enabled <== 1;
    signatureVerifier.Ax <== senderPub[0];
    signatureVerifier.Ay <== senderPub[1];
    signatureVerifier.S <== signatureS;
    signatureVerifier.R8x <== signatureR[0];
    signatureVerifier.R8y <== signatureR[1];
    signatureVerifier.M <== senderCommitment0;

    /////////////////////////////
    // Sender Commitment Check //
    /////////////////////////////
    component commitmentCheckerSender0 = CommitmentChecker();
    commitmentCheckerSender0.amount <== amount;
    commitmentCheckerSender0.pub[0] <== senderPub[0];
    commitmentCheckerSender0.pub[1] <== senderPub[1];
    commitmentCheckerSender0.nullifier <== senderNullfier0;
    commitmentCheckerSender0.commitment <== senderCommitment0;

    component nullifierChecker = NullifierChecker();
    nullifierChecker.nullifier <== senderNullfier0;
    nullifierChecker.nullifierHash <== senderNullifierHash0;

    ///////////////////////////////
    // Receiver Commitment Check //
    ///////////////////////////////
    component commitmentCheckerReceiver0 = CommitmentChecker();
    commitmentCheckerReceiver0.amount <== amountChange;
    commitmentCheckerReceiver0.pub[0] <== receiverPub[0];
    commitmentCheckerReceiver0.pub[1] <== receiverPub[1];
    commitmentCheckerReceiver0.nullifier <== receiverNullifier0;
    commitmentCheckerReceiver0.commitment <== receiverCommitment0;

    ///////////////////////
    // Merkle Tree Check //
    ///////////////////////
    component merkleChecker = MerkleChecker(n);
    merkleChecker.element <== senderCommitment0;
    merkleChecker.root <== root;
    for (var i = 0; i < n; i++) {
        merkleChecker.merkleSiblings[i] <== merkleSiblings[i];
        merkleChecker.merkleSiblingIsLeft[i] <== merkleSiblingIsLeft[i];
    }

    //////////////////
    // Amount Check //
    //////////////////
    // We don't allow -ve amounts; prevents underflow/overflow cheats
    component signWithdrawal = GetSign();
    signWithdrawal.num <== amountWithdrawal;
    signWithdrawal.sign === 0;

    component signAmount = GetSign();
    signAmount.num <== amount;
    signAmount.sign === 0;

    component signChange = GetSign();
    signChange.num <== amountChange;
    signChange.sign === 0;
    
    amount === amountWithdrawal + amountChange;
    isValid <== 42;
}

component main{public [root, senderCommitment0, senderNullifierHash0, receiverCommitment0, amountWithdrawal]} = Withdraw(4);