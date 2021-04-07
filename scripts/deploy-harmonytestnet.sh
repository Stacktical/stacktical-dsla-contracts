#!/bin/bash
export NODE_ENV=harmonytestnet
npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network harmonytestnet

./scripts/export-data.sh

