pragma circom 2.0.6;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/switcher.circom";

template MerkleChecker(n){
    signal input element;
    signal input root;

    signal input merkleSiblings[n];
    signal input merkleSiblingIsLeft[n];

    component poseidonHashers[n];
    component switchers[n];

    var currentHash = element;
    for(var i = 0; i < n; i++){
        switchers[i] = Switcher();
        switchers[i].sel <== 1 - merkleSiblingIsLeft[i];
        switchers[i].L <== currentHash;
        switchers[i].R <== merkleSiblings[i];

        log(switchers[i].outL);
        log(switchers[i].outR);
        
        poseidonHashers[i] = Poseidon(2);
        poseidonHashers[i].inputs[0] <== switchers[i].outL;
        poseidonHashers[i].inputs[1] <== switchers[i].outR;
        currentHash = poseidonHashers[i].out;
    }

    poseidonHashers[n-1].out === root;
}