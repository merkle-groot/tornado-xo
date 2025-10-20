pragma circom 2.0.4;

template isZero() {
    signal input in1;
    signal output out;
    signal aux;

    aux <-- in1 != 0 ? 1/in1 : 0;
    out <== -aux * in1 + 1;
    log(out);
}

component main{public [in1]} = isZero();