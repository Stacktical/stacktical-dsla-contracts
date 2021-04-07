#!/bin/bash
export NODE_ENV=develop
npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network develop

./scripts/export-data.sh