#/bin/bash
npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network staging

#Export data
truffle exec --network staging scripts/export-abis.js
truffle exec --network staging scripts/export-addresses.js
truffle exec --network staging scripts/create-natspec-docs.js
npx prettier --write 'natspec-docs/**/**.json'
npx prettier --config .prettierrc.abis.json --write 'exported-data/**.ts'

# Fund account with tokens
truffle exec --network staging scripts/mint-bdsla.js
truffle exec --network staging scripts/mint-dai.js
truffle exec --network staging scripts/mint-usdc.js
