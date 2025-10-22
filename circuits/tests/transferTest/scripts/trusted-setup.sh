
#!/bin/bash
set -e

if ! command -v snarkjs &> /dev/null
then
    echo "Error: snarkjs is not installed. Please install it first." >&2
    exit 1
fi

# Define folder prefix
OUTPUT_DIR="./testOutput"
CIRCUITS_DIR="$OUTPUT_DIR/compiledCircuits"
PTAU_DIR="$OUTPUT_DIR/ptau"

echo "Performing trusted setup..."
mkdir -p "$PTAU_DIR"

snarkjs powersoftau new bn128 14 "$PTAU_DIR/pot12_0000.ptau" -v
snarkjs powersoftau contribute "$PTAU_DIR/pot12_0000.ptau" "$PTAU_DIR/pot12_0001.ptau" --name="First contribution" -v <<< "randome numbers 843 912 19 1"
snarkjs powersoftau prepare phase2 "$PTAU_DIR/pot12_0001.ptau" "$PTAU_DIR/pot12_final.ptau" -v
snarkjs groth16 setup "$CIRCUITS_DIR/transfer.r1cs" "$PTAU_DIR/pot12_final.ptau" "$PTAU_DIR/transfer_0000.zkey"
snarkjs zkey contribute "$PTAU_DIR/transfer_0000.zkey" "$PTAU_DIR/transfer_0001.zkey" --name="merkle-groot" -v  <<< "randome numbers 48931 938 1251 06105"
snarkjs zkey export verificationkey "$PTAU_DIR/transfer_0001.zkey" "$OUTPUT_DIR/verification_key.json"

echo "Trusted setup completed successfully!"
