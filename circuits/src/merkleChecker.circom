pragma circom 2.0.4;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/switcher.circom";

template MerkleChecker(n){
    signal input element;
    signal input root;

    signal input merkleSiblings[n];
    signal input merkleSiblingIsLeft[n];
    signal input levelsUsed;

    component poseidonHashers[n];
    component compareLevel[n];
    component constrainRoot[n];
    component switchers[n];

    var currentHash = element;
    for(var i = n-1; i >= 0; i--){
        switchers[i] = Switcher();
        switchers[i].sel <== merkleSiblingIsLeft[i];
        switchers[i].L <== merkleSiblings[i];
        switchers[i].R <== currentHash;

        
        poseidonHashers[i] = Poseidon(2);
        poseidonHashers[i].inputs[0] <== switchers[i].outL;
        poseidonHashers[i].inputs[1] <== switchers[i].outR;

        compareLevel[i] = IsEqual();
        compareLevel[i].in[0] <== (n - levelsUsed);
        compareLevel[i].in[1] <== i;

        constrainRoot[i] = ForceEqualIfEnabled();
        constrainRoot[i].in[0] <== poseidonHashers[i].out;
        constrainRoot[i].in[1] <== root;
        constrainRoot[i].enabled <== compareLevel[i].out;

        currentHash = poseidonHashers[i].out;
    }

}