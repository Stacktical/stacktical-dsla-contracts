#!/bin/bash
export NODE_ENV=harmonytestnet
npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network harmonytestnet

./scripts/export-data.sh

# copy abis and addresses to frontend, depends on relative roots
rm -rf ../stacktical-dsla-frontend/src/contracts/**
cp ./exported-data/* ../stacktical-dsla-frontend/src/contracts

