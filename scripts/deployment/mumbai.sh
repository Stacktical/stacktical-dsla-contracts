#!/bin/bash
export NODE_ENV=mumbai

npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network mumbai
./scripts/chores/export-data.sh

truffle exec --network mumbai scripts/bootstrap/develop.js
truffle exec --network mumbai scripts/chores/mint-tokens.js
truffle exec --network mumbai scripts/chores/deploy-sla.js
truffle exec --network mumbai scripts/chores/request-analytics.js
truffle exec --network mumbai scripts/chores/request-sli.js
