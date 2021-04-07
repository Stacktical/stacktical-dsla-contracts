#!/bin/bash
export NODE_ENV=harmonytestnet

npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network harmonytestnet

truffle exec --network harmonytestnet scripts/bootstrap/develop.js
truffle exec --network harmonytestnet scripts/chores/mint-tokens.js
truffle exec --network harmonytestnet scripts/chores/deploy-sla.js

./scripts/chores/export-data.sh