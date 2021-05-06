#!/bin/bash

truffle exec --network kovan scripts/chores/export-abis.js
truffle exec --network kovan scripts/chores/export-abis-concatenated.js
truffle exec --network kovan scripts/chores/create-natspec-docs.js
npx prettier --config .prettierrc.abis-ts.json --write 'exported-data/**/**.ts'
npx prettier --config .prettierrc.abis-js.json --write 'exported-data/**/**.js'
npx prettier --write 'natspec-docs/**/**.json'

# copy abis and addresses to frontend, depends on relative roots
rm -rf ../stacktical-dsla-frontend/src/contracts/**
cp -r ./exported-data/* ../stacktical-dsla-frontend/src/contracts

# copy abis to external adapter
rm -rf ../stacktical-chainlink-external-adapter/apps/chainlink-adapter/src/assets/**
cp ./exported-data/NetworkAnalyticsABI.ts ../stacktical-chainlink-external-adapter/apps/chainlink-adapter/src/assets
cp ./exported-data/SLAABI.ts ../stacktical-chainlink-external-adapter/apps/chainlink-adapter/src/assets

# copy abis to dsla-indexer
rm -f ../dsla-indexer/abis.js
cp ./exported-data/ABISConcatenated.js ../dsla-indexer/abis.js
