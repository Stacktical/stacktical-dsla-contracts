#/bin/bash
npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network develop

#Export data
truffle exec --network develop scripts/export-abis.js
truffle exec --network develop scripts/export-addresses.js
truffle exec --network develop scripts/create-natspec-docs.js
npx prettier --write 'natspec-docs/**/**.json'
npx prettier --config .prettierrc.abis.json --write 'exported-data/**.ts'

# Fund account with tokens
truffle exec --network develop scripts/mint-bdsla.js
truffle exec --network develop scripts/mint-dai.js
truffle exec --network develop scripts/mint-usdc.js
