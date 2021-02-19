#!/bin/bash
npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network staging

./export-data.sh

# Fund account with tokens
truffle exec --network staging scripts/mint-bdsla.js
truffle exec --network staging scripts/mint-dai.js
truffle exec --network staging scripts/mint-usdc.js
