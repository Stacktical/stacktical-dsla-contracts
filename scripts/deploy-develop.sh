#!/bin/bash
export NODE_ENV=develop
npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network develop

./scripts/export-data.sh

# copy abis and addresses to frontend, depends on relative roots
rm -rf ../stacktical-dsla-frontend/src/contracts/**
cp ./exported-data/* ../stacktical-dsla-frontend/src/contracts

# Fund account with tokens// funded on deploy script
# truffle exec --network develop scripts/mint-bdsla.js
# truffle exec --network develop scripts/mint-dai.js
# truffle exec --network develop scripts/mint-usdc.js
