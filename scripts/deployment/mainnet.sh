#!/bin/bash
export NODE_ENV=mainnet

npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network mainnet

truffle exec --network mainnet scripts/bootstrap/mainnet.js

./scripts/chores/export-data.sh