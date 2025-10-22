#!/bin/bash
set -e

if ! command -v co-circom &> /dev/null
then
    echo "Error: co-circom is not installed. Please install it first." >&2
    exit 1
fi

# Define folder prefix
OUTPUT_DIR="./testOutput"
CIRCUIT_DIR="./circuits/src/transfer.circom"
MERGED_DIR="$OUTPUT_DIR/merged_inputs"
CONFIG_DIR="./circuits/tests/transferTest/configs"
WITNESS_DIR="$OUTPUT_DIR/witness"

echo "Generating witnesses for all parties..."
mkdir -p "$WITNESS_DIR"

# Start all three parties in background
co-circom generate-witness --input "$MERGED_DIR/input.json.0.shared" --circuit "$CIRCUIT_DIR" --protocol REP3 --curve BN254 --config "$CONFIG_DIR/party0.toml" --out "$WITNESS_DIR/witness.wtns.0.shared" &
PARTY0_PID=$!

co-circom generate-witness --input "$MERGED_DIR/input.json.1.shared" --circuit "$CIRCUIT_DIR" --protocol REP3 --curve BN254 --config "$CONFIG_DIR/party1.toml" --out "$WITNESS_DIR/witness.wtns.1.shared" &
PARTY1_PID=$!

co-circom generate-witness --input "$MERGED_DIR/input.json.2.shared" --circuit "$CIRCUIT_DIR" --protocol REP3 --curve BN254 --config "$CONFIG_DIR/party2.toml" --out "$WITNESS_DIR/witness.wtns.2.shared" &
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

# Check if any party failed
if [ $PARTY0_EXIT -ne 0 ] || [ $PARTY1_EXIT -ne 0 ] || [ $PARTY2_EXIT -ne 0 ]; then
    echo "Error: One or more parties failed to generate witnesses." >&2
    exit 1
fi

echo "Witness generation completed successfully!"