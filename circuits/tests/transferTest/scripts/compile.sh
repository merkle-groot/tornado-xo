#!/bin/bash
set -e

if ! command -v circom &> /dev/null
then
    echo "Error: circom is not installed. Please install it first." >&2
    exit 1
fi

echo "Compiling transfer circuit..."
mkdir -p "./testOutput/compiledCircuits"

circom circuits/src/transfer.circom --r1cs --output ./testOutput/compiledCircuits
echo "Compilation completed successfully!"
