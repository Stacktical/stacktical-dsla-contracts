#!/bin/bash
export NODE_ENV=kovan
npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network kovan

./export-data.sh

# Fund account with tokens
truffle exec --network kovan scripts/mint-bdsla.js
truffle exec --network kovan scripts/mint-dai.js
truffle exec --network kovan scripts/mint-usdc.js
