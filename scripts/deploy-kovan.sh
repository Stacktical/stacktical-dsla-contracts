#!/bin/bash
export NODE_ENV=kovan
npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network kovan

./scripts/export-data.sh

