#/bin/bash
npx prettier --write 'contracts/**/*.sol'

truffle deploy --reset --network kovan

#Export data
truffle exec --network kovan scripts/export-abis.js
truffle exec --network kovan scripts/export-addresses.js
truffle exec --network kovan scripts/create-natspec-docs.js
npx prettier --write 'natspec-docs/**/**.json'
npx prettier --config .prettierrc.abis.json --write 'exported-data/**.ts'

# Fund account with tokens
truffle exec --network kovan scripts/mint-bdsla.js
truffle exec --network kovan scripts/mint-dai.js
truffle exec --network kovan scripts/mint-usdc.js
