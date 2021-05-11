#!/bin/bash
export NODE_ENV=polygon

npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network polygon
./scripts/chores/export-data.sh

truffle exec --network polygon scripts/bootstrap/mainnet.js
