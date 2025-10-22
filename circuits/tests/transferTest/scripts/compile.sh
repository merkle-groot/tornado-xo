#!/bin/bash
present=$(which circom)
if [ $present == '']
then 
    echo "Please install circom"
    exit 1
else
    echo "Moving onto compiling transfer circuit"
fi

