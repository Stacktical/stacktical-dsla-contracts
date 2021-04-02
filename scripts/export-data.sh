#!/bin/bash

truffle exec --network kovan scripts/export-abis.js
truffle exec --network kovan scripts/export-addresses.js
truffle exec --network kovan scripts/create-natspec-docs.js
npx prettier --config .prettierrc.abis.json --write 'exported-data/**.ts'
npx prettier --write 'natspec-docs/**/**.json'