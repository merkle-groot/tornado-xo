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
SPLIT_DIR="$OUTPUT_DIR/split_inputs"
MERGED_DIR="$OUTPUT_DIR/merged_inputs"

echo "Splitting and merging input shares..."
mkdir -p "$SPLIT_DIR"
mkdir -p "$MERGED_DIR"

co-circom split-input --circuit "$CIRCUIT_DIR" --input "$OUTPUT_DIR/input1.json" --protocol REP3 --curve BN254 --out-dir "$SPLIT_DIR"
co-circom split-input --circuit "$CIRCUIT_DIR" --input "$OUTPUT_DIR/input2.json" --protocol REP3 --curve BN254 --out-dir "$SPLIT_DIR"

co-circom merge-input-shares --circuit "$CIRCUIT_DIR" --inputs "$SPLIT_DIR/input1.json.0.shared" --inputs "$SPLIT_DIR/input2.json.0.shared" --protocol REP3 --curve BN254 --out "$MERGED_DIR/input.json.0.shared"
co-circom merge-input-shares --circuit "$CIRCUIT_DIR" --inputs "$SPLIT_DIR/input1.json.1.shared" --inputs "$SPLIT_DIR/input2.json.1.shared" --protocol REP3 --curve BN254 --out "$MERGED_DIR/input.json.1.shared"
co-circom merge-input-shares --circuit "$CIRCUIT_DIR" --inputs "$SPLIT_DIR/input1.json.2.shared" --inputs "$SPLIT_DIR/input2.json.2.shared" --protocol REP3 --curve BN254 --out "$MERGED_DIR/input.json.2.shared"

echo "Split and merge operations completed successfully!"