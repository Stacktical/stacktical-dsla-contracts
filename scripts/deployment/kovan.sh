#!/bin/bash
export NODE_ENV=kovan

npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network kovan
./scripts/chores/export-data.sh

truffle exec --network kovan scripts/bootstrap/testnet.js
truffle exec --network kovan scripts/chores/mint-tokens.js
truffle exec --network kovan scripts/chores/deploy-sla.js
