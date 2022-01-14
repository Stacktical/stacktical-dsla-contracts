/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Details, DetailsInterface } from "../Details";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_slaAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
    ],
    name: "getDTokensDetails",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "tokenAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "totalSupply",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "dTokenAddress",
            type: "address",
          },
          {
            internalType: "string",
            name: "dTokenSymbol",
            type: "string",
          },
          {
            internalType: "string",
            name: "dTokenName",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "balance",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "allowance",
            type: "uint256",
          },
        ],
        internalType: "struct Details.DtokenDetails[]",
        name: "dpTokens",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "address",
            name: "tokenAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "totalSupply",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "dTokenAddress",
            type: "address",
          },
          {
            internalType: "string",
            name: "dTokenSymbol",
            type: "string",
          },
          {
            internalType: "string",
            name: "dTokenName",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "balance",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "allowance",
            type: "uint256",
          },
        ],
        internalType: "struct Details.DtokenDetails[]",
        name: "duTokens",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_slaAddress",
        type: "address",
      },
    ],
    name: "getSLADetailsArrays",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "sli",
            type: "uint256",
          },
          {
            internalType: "enum SLA.Status",
            name: "status",
            type: "uint8",
          },
        ],
        internalType: "struct SLA.PeriodSLI[]",
        name: "periodSLIs",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "address",
            name: "tokenAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "totalStake",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "usersPool",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "providerPool",
            type: "uint256",
          },
        ],
        internalType: "struct Details.TokenStake[]",
        name: "tokensStake",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_slaAddress",
        type: "address",
      },
    ],
    name: "getSLADynamicDetails",
    outputs: [
      {
        internalType: "uint256",
        name: "stakersCount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "nextVerifiablePeriod",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "leverage",
        type: "uint64",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_slaAddress",
        type: "address",
      },
      {
        internalType: "contract SLORegistry",
        name: "_sloRegistry",
        type: "address",
      },
    ],
    name: "getSLAStaticDetails",
    outputs: [
      {
        internalType: "address",
        name: "slaOwner",
        type: "address",
      },
      {
        internalType: "address",
        name: "messengerAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "sloValue",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "creationBlockNumber",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "slaId",
        type: "uint256",
      },
      {
        internalType: "uint128",
        name: "initialPeriodId",
        type: "uint128",
      },
      {
        internalType: "uint128",
        name: "finalPeriodId",
        type: "uint128",
      },
      {
        internalType: "bool",
        name: "whiteListed",
        type: "bool",
      },
      {
        internalType: "enum IPeriodRegistry.PeriodType",
        name: "periodType",
        type: "uint8",
      },
      {
        internalType: "enum SLORegistry.SLOType",
        name: "sloType",
        type: "uint8",
      },
      {
        internalType: "string",
        name: "ipfsHash",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50611d93806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c806330f1bef014610051578063431b7770146100845780637922f334146100a6578063afa029e4146100c7575b600080fd5b61006461005f366004611860565b6100e8565b60405161007b9b9a99989796959493929190611b74565b60405180910390f35b6100976100923660046117e9565b6105aa565b60405161007b93929190611ce8565b6100b96100b4366004611828565b610713565b60405161007b929190611c02565b6100da6100d53660046117e9565b610f7c565b60405161007b929190611c30565b600080600080600080600080600080606060008d9050806001600160a01b0316638da5cb5b6040518163ffffffff1660e01b815260040160206040518083038186803b15801561013757600080fd5b505afa15801561014b573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061016f919061180c565b9b50806001600160a01b031663a224ee9c6040518163ffffffff1660e01b815260040160206040518083038186803b1580156101aa57600080fd5b505afa1580156101be573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101e2919061180c565b9a50806001600160a01b03166318e454276040518163ffffffff1660e01b815260040160206040518083038186803b15801561021d57600080fd5b505afa158015610231573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102559190611872565b9450806001600160a01b03166346e0fbae6040518163ffffffff1660e01b815260040160206040518083038186803b15801561029057600080fd5b505afa1580156102a4573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102c89190611892565b93508c6001600160a01b031663a7b72ac58f6040518263ffffffff1660e01b81526004016102f69190611b46565b604080518083038186803b15801561030d57600080fd5b505afa158015610321573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103459190611988565b809450819b505050806001600160a01b0316631bf309296040518163ffffffff1660e01b815260040160206040518083038186803b15801561038657600080fd5b505afa15801561039a573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103be9190611970565b9850806001600160a01b031663f2db10fe6040518163ffffffff1660e01b815260040160206040518083038186803b1580156103f957600080fd5b505afa15801561040d573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104319190611949565b6001600160801b03169750806001600160a01b031663c623674f6040518163ffffffff1660e01b815260040160006040518083038186803b15801561047557600080fd5b505afa158015610489573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f191682016040526104b191908101906118ae565b9150806001600160a01b0316632526743a6040518163ffffffff1660e01b815260040160206040518083038186803b1580156104ec57600080fd5b505afa158015610500573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105249190611949565b9650806001600160a01b0316633385d3346040518163ffffffff1660e01b815260040160206040518083038186803b15801561055f57600080fd5b505afa158015610573573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105979190611949565b9550509295989b509295989b9093969950565b600080600080849050806001600160a01b0316639fabeb006040518163ffffffff1660e01b815260040160206040518083038186803b1580156105ec57600080fd5b505afa158015610600573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106249190611970565b9350806001600160a01b031663b1659bad6040518163ffffffff1660e01b815260040160206040518083038186803b15801561065f57600080fd5b505afa158015610673573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106979190611970565b9250806001600160a01b0316632c86d98e6040518163ffffffff1660e01b815260040160206040518083038186803b1580156106d257600080fd5b505afa1580156106e6573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061070a91906119e7565b93959294505050565b6060806000806001600160a01b0316846001600160a01b03161415905060008590506000816001600160a01b031663b7bc347e6040518163ffffffff1660e01b815260040160206040518083038186803b15801561077057600080fd5b505afa158015610784573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107a89190611970565b90508067ffffffffffffffff811180156107c157600080fd5b506040519080825280602002602001820160405280156107fb57816020015b6107e861173e565b8152602001906001900390816107e05790505b5094508067ffffffffffffffff8111801561081557600080fd5b5060405190808252806020026020018201604052801561084f57816020015b61083c61173e565b8152602001906001900390816108345790505b50935060005b81811015610f7157604051632f2f971360e11b81526000906001600160a01b03851690635e5f2e269061088c908590600401611cdf565b60206040518083038186803b1580156108a457600080fd5b505afa1580156108b8573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108dc919061180c565b90506000846001600160a01b0316634fb2647e836040518263ffffffff1660e01b815260040161090c9190611b46565b60206040518083038186803b15801561092457600080fd5b505afa158015610938573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061095c919061180c565b90506040518060e00160405280836001600160a01b03168152602001826001600160a01b03166318160ddd6040518163ffffffff1660e01b815260040160206040518083038186803b1580156109b157600080fd5b505afa1580156109c5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109e99190611970565b8152602001826001600160a01b03168152602001826001600160a01b03166395d89b416040518163ffffffff1660e01b815260040160006040518083038186803b158015610a3657600080fd5b505afa158015610a4a573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610a7291908101906118ae565b8152602001826001600160a01b03166306fdde036040518163ffffffff1660e01b815260040160006040518083038186803b158015610ab057600080fd5b505afa158015610ac4573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610aec91908101906118ae565b815260200187610afd576000610b79565b6040516370a0823160e01b81526001600160a01b038416906370a0823190610b29908e90600401611b46565b60206040518083038186803b158015610b4157600080fd5b505afa158015610b55573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610b799190611970565b815260200187610b8a576000610c08565b826001600160a01b031663dd62ed3e8c8e6040518363ffffffff1660e01b8152600401610bb8929190611b5a565b60206040518083038186803b158015610bd057600080fd5b505afa158015610be4573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610c089190611970565b815250888481518110610c1757fe5b60200260200101819052506000856001600160a01b0316634e0c91f6846040518263ffffffff1660e01b8152600401610c509190611b46565b60206040518083038186803b158015610c6857600080fd5b505afa158015610c7c573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610ca0919061180c565b90506040518060e00160405280846001600160a01b03168152602001826001600160a01b03166318160ddd6040518163ffffffff1660e01b815260040160206040518083038186803b158015610cf557600080fd5b505afa158015610d09573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610d2d9190611970565b8152602001826001600160a01b03168152602001826001600160a01b03166395d89b416040518163ffffffff1660e01b815260040160006040518083038186803b158015610d7a57600080fd5b505afa158015610d8e573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610db691908101906118ae565b8152602001826001600160a01b03166306fdde036040518163ffffffff1660e01b815260040160006040518083038186803b158015610df457600080fd5b505afa158015610e08573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610e3091908101906118ae565b815260200188610e41576000610ebd565b6040516370a0823160e01b81526001600160a01b038416906370a0823190610e6d908f90600401611b46565b60206040518083038186803b158015610e8557600080fd5b505afa158015610e99573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610ebd9190611970565b815260200188610ece576000610f4c565b826001600160a01b031663dd62ed3e8d8f6040518363ffffffff1660e01b8152600401610efc929190611b5a565b60206040518083038186803b158015610f1457600080fd5b505afa158015610f28573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610f4c9190611970565b815250888581518110610f5b57fe5b6020908102919091010152505050600101610855565b505050509250929050565b60608060008390506000816001600160a01b0316632526743a6040518163ffffffff1660e01b815260040160206040518083038186803b158015610fbf57600080fd5b505afa158015610fd3573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610ff79190611949565b6001600160801b031690506000826001600160a01b0316633385d3346040518163ffffffff1660e01b815260040160206040518083038186803b15801561103d57600080fd5b505afa158015611051573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906110759190611949565b6001600160801b031690506001828203018067ffffffffffffffff8111801561109d57600080fd5b506040519080825280602002602001820160405280156110d757816020015b6110c461178d565b8152602001906001900390816110bc5790505b50955060005b818110156111c0576040516320c876ef60e11b815284820190600090819081906001600160a01b038a1690634190edde9061111c908790600401611cdf565b60606040518083038186803b15801561113457600080fd5b505afa158015611148573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061116c91906119ac565b925092509250604051806060016040528084815260200183815260200182600281111561119557fe5b8152508b86815181106111a457fe5b60200260200101819052505050505080806001019150506110dd565b506000846001600160a01b031663b7bc347e6040518163ffffffff1660e01b815260040160206040518083038186803b1580156111fc57600080fd5b505afa158015611210573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906112349190611970565b90508067ffffffffffffffff8111801561124d57600080fd5b5060405190808252806020026020018201604052801561128757816020015b6112746117b8565b81526020019060019003908161126c5790505b50955060005b8181101561173357604051632f2f971360e11b81526000906001600160a01b03881690635e5f2e26906112c4908590600401611cdf565b60206040518083038186803b1580156112dc57600080fd5b505afa1580156112f0573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611314919061180c565b90506040518060800160405280826001600160a01b03168152602001886001600160a01b031663639b6fc38a6001600160a01b0316635e5f2e26876040518263ffffffff1660e01b815260040161136b9190611cdf565b60206040518083038186803b15801561138357600080fd5b505afa158015611397573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906113bb919061180c565b6040518263ffffffff1660e01b81526004016113d79190611b46565b60206040518083038186803b1580156113ef57600080fd5b505afa158015611403573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114279190611970565b604051632f2f971360e11b81526001600160a01b038b169063484fbf2b908290635e5f2e269061145b908a90600401611cdf565b60206040518083038186803b15801561147357600080fd5b505afa158015611487573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114ab919061180c565b6040518263ffffffff1660e01b81526004016114c79190611b46565b60206040518083038186803b1580156114df57600080fd5b505afa1580156114f3573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906115179190611970565b018152602001886001600160a01b031663484fbf2b8a6001600160a01b0316635e5f2e26876040518263ffffffff1660e01b81526004016115589190611cdf565b60206040518083038186803b15801561157057600080fd5b505afa158015611584573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906115a8919061180c565b6040518263ffffffff1660e01b81526004016115c49190611b46565b60206040518083038186803b1580156115dc57600080fd5b505afa1580156115f0573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906116149190611970565b8152602001886001600160a01b031663639b6fc38a6001600160a01b0316635e5f2e26876040518263ffffffff1660e01b81526004016116549190611cdf565b60206040518083038186803b15801561166c57600080fd5b505afa158015611680573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906116a4919061180c565b6040518263ffffffff1660e01b81526004016116c09190611b46565b60206040518083038186803b1580156116d857600080fd5b505afa1580156116ec573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906117109190611970565b81525088838151811061171f57fe5b60209081029190910101525060010161128d565b505050505050915091565b6040518060e0016040528060006001600160a01b031681526020016000815260200160006001600160a01b03168152602001606081526020016060815260200160008152602001600081525090565b60405180606001604052806000815260200160008152602001600060028111156117b357fe5b905290565b604051806080016040528060006001600160a01b031681526020016000815260200160008152602001600081525090565b6000602082840312156117fa578081fd5b813561180581611d38565b9392505050565b60006020828403121561181d578081fd5b815161180581611d38565b6000806040838503121561183a578081fd5b823561184581611d38565b9150602083013561185581611d38565b809150509250929050565b6000806040838503121561183a578182fd5b600060208284031215611883578081fd5b81518015158114611805578182fd5b6000602082840312156118a3578081fd5b815161180581611d50565b6000602082840312156118bf578081fd5b815167ffffffffffffffff808211156118d6578283fd5b81840185601f8201126118e7578384fd5b80519250818311156118f7578384fd5b604051601f8401601f191681016020018381118282101715611917578586fd5b60405283815281840160200187101561192e578485fd5b61193f846020830160208501611d08565b9695505050505050565b60006020828403121561195a578081fd5b81516001600160801b0381168114611805578182fd5b600060208284031215611981578081fd5b5051919050565b6000806040838503121561199a578182fd5b82519150602083015161185581611d50565b6000806000606084860312156119c0578081fd5b83519250602084015191506040840151600381106119dc578182fd5b809150509250925092565b6000602082840312156119f8578081fd5b815167ffffffffffffffff81168114611805578182fd5b80516001600160a01b0316825260208082015190830152604080820151908301526060908101519082015260800190565b6001600160a01b03169052565b6000815180845260208085018081965082840281019150828601855b85811015611aff578284038952815160e0611a85868351611a40565b8682015187870152604080830151611a9f82890182611a40565b50506060808301518282890152611ab883890182611b1a565b915050608091508183015187820383890152611ad48282611b1a565b60a085810151908a015260c09485015194909801939093525050509784019790840190600101611a69565b5091979650505050505050565b60068110611b1657fe5b9052565b60008151808452611b32816020860160208601611d08565b601f01601f19169290920160200192915050565b6001600160a01b0391909116815260200190565b6001600160a01b0392831681529116602082015260400190565b6001600160a01b038c811682528b166020820152604081018a905260608101899052608081018890526001600160801b0387811660a0830152861660c082015284151560e08201526000610160611bcf610100840187611b0c565b611bdd610120840186611b0c565b80610140840152611bf081840185611b1a565b9e9d5050505050505050505050505050565b600060408252611c156040830185611a4d565b8281036020840152611c278185611a4d565b95945050505050565b6040808252835182820181905260009190606090818501906020808901865b83811015611c885781518051865283810151848701528781015160038110611c7357fe5b86890152509385019390820190600101611c4f565b50508683038188015282945087519350611ca28484611cdf565b945080880192508591505b83821015611cd257611cc0858451611a0f565b94508083019250600182019150611cad565b5092979650505050505050565b90815260200190565b928352602083019190915267ffffffffffffffff16604082015260600190565b60005b83811015611d23578181015183820152602001611d0b565b83811115611d32576000848401525b50505050565b6001600160a01b0381168114611d4d57600080fd5b50565b60068110611d4d57600080fdfea2646970667358221220fe7a965b101a98f91880d1cb50b65b18691d9152a100258e4a988337992d93c464736f6c63430006060033";

export class Details__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<Details> {
    return super.deploy(overrides || {}) as Promise<Details>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Details {
    return super.attach(address) as Details;
  }
  connect(signer: Signer): Details__factory {
    return super.connect(signer) as Details__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): DetailsInterface {
    return new utils.Interface(_abi) as DetailsInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Details {
    return new Contract(address, _abi, signerOrProvider) as Details;
  }
}
