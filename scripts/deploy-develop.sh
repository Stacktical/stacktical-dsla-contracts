#!/bin/bash
export NODE_ENV=develop
npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network develop

./scripts/export-data.sh

# Fund account with tokens
truffle exec --network develop scripts/mint-bdsla.js
truffle exec --network develop scripts/mint-dai.js
truffle exec --network develop scripts/mint-usdc.js
