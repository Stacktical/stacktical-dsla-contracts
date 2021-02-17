#/bin/bash
export NODE_ENV=develop
truffle deploy --reset --network develop

#Export data
truffle exec --network develop scripts/export-abis.js
truffle exec --network develop scripts/export-addresses.js
truffle exec --network develop scripts/create-natspec-docs.js
npx prettier --write 'contracts/**/*.sol'
npx prettier --write 'natspec-docs/**/**.json'
npx prettier --config .prettierrc.abis.json --write 'exported-data/**.ts'

# Fund account with tokens
truffle exec --network develop scripts/mint-bdsla.js
truffle exec --network develop scripts/mint-dai.js
truffle exec --network develop scripts/mint-usdc.js
