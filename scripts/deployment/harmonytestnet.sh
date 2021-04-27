#!/bin/bash
export NODE_ENV=harmonytestnet

npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network harmonytestnet
./scripts/chores/export-data.sh

truffle exec --network harmonytestnet scripts/bootstrap/testnet.js
truffle exec --network harmonytestnet scripts/chores/mint-tokens.js
truffle exec --network harmonytestnet scripts/chores/deploy-sla.js
#truffle exec --network harmonytestnet scripts/chores/request-analytics.js
#truffle exec --network harmonytestnet scripts/chores/request-sli.js
