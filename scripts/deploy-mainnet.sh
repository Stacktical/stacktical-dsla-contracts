#!/bin/bash
export NODE_ENV=mainnet

npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network mainnet

./export-data.sh
