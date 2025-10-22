#!/bin/bash
set -e

if ! command -v co-circom &> /dev/null
then
    echo "Error: co-circom is not installed. Please install it first." >&2
    exit 1
fi

# Define folder prefix
OUTPUT_DIR="./testOutput"
PROOF_DIR="$OUTPUT_DIR/proof"
WITNESS_DIR="$OUTPUT_DIR/witness"
PTAU_DIR="$OUTPUT_DIR/ptau"
CONFIG_DIR="./circuits/tests/transferTest/configs"

echo "Starting multi-party proof generation..."
echo "All three parties will run in parallel"
mkdir -p "$PROOF_DIR"

# Start all three parties in background
co-circom generate-proof --witness "$WITNESS_DIR/witness.wtns.0.shared" --zkey "$PTAU_DIR/transfer_0001.zkey" --protocol REP3 --config "$CONFIG_DIR/party0.toml" --out "$PROOF_DIR/proof.json" groth16 --curve BN254 &
PARTY0_PID=$!

co-circom generate-proof --witness "$WITNESS_DIR/witness.wtns.1.shared" --zkey "$PTAU_DIR/transfer_0001.zkey" --protocol REP3 --config "$CONFIG_DIR/party1.toml" --out "$PROOF_DIR/proof.json" groth16 --curve BN254 &
PARTY1_PID=$!

co-circom generate-proof --witness "$WITNESS_DIR/witness.wtns.2.shared" --zkey "$PTAU_DIR/transfer_0001.zkey" --protocol REP3 --config "$CONFIG_DIR/party2.toml" --out "$PROOF_DIR/proof.json" groth16 --curve BN254 &
PARTY2_PID=$!

echo "Party 0 PID: $PARTY0_PID"
echo "Party 1 PID: $PARTY1_PID"
echo "Party 2 PID: $PARTY2_PID"

# Wait for all parties to complete
echo "Waiting for all parties to complete..."
wait $PARTY0_PID
PARTY0_EXIT=$?
wait $PARTY1_PID
PARTY1_EXIT=$?
wait $PARTY2_PID
PARTY2_EXIT=$?

echo "All parties completed!"
echo "Party 0 exit code: $PARTY0_EXIT"
echo "Party 1 exit code: $PARTY1_EXIT"
echo "Party 2 exit code: $PARTY2_EXIT"

# Check if all parties succeeded
if [ $PARTY0_EXIT -eq 0 ] && [ $PARTY1_EXIT -eq 0 ] && [ $PARTY2_EXIT -eq 0 ]; then
    echo "✅ Multi-party proof generation successful!"
else
    echo "❌ One or more parties failed!" >&2
    exit 1
fi
