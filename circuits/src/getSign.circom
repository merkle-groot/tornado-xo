pragma circom 2.0.6;
include "../../node_modules/circomlib/circuits/sign.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

template GetSign() {
    signal input num;
    signal output sign;

    component num2Bits = Num2Bits(254);
    num2Bits.in <== num;

    component getSign = Sign();
    for(var i=0; i<254; i++){
        getSign.in[i] <== num2Bits.out[i];
    }

    sign <== getSign.sign;
}
