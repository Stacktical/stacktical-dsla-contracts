#!/bin/bash

truffle exec --network develop scripts/export-abis.js
truffle exec --network develop scripts/export-addresses.js
truffle exec --network develop scripts/create-natspec-docs.js
npx prettier --config .prettierrc.abis.json --write 'exported-data/**.ts'
npx prettier --write 'natspec-docs/**/**.json'