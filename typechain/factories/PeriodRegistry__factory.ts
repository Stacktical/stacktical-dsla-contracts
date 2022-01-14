/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  PeriodRegistry,
  PeriodRegistryInterface,
} from "../PeriodRegistry";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "enum IPeriodRegistry.PeriodType",
        name: "periodType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "periodsAdded",
        type: "uint256",
      },
    ],
    name: "PeriodInitialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "enum IPeriodRegistry.PeriodType",
        name: "periodType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "periodsAdded",
        type: "uint256",
      },
    ],
    name: "PeriodModified",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "enum IPeriodRegistry.PeriodType",
        name: "_periodType",
        type: "uint8",
      },
      {
        internalType: "uint256[]",
        name: "_periodStarts",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "_periodEnds",
        type: "uint256[]",
      },
    ],
    name: "addPeriodsToPeriodType",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getPeriodDefinitions",
    outputs: [
      {
        components: [
          {
            internalType: "bool",
            name: "initialized",
            type: "bool",
          },
          {
            internalType: "uint256[]",
            name: "starts",
            type: "uint256[]",
          },
          {
            internalType: "uint256[]",
            name: "ends",
            type: "uint256[]",
          },
        ],
        internalType: "struct PeriodRegistry.PeriodDefinition[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum IPeriodRegistry.PeriodType",
        name: "_periodType",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "_periodId",
        type: "uint256",
      },
    ],
    name: "getPeriodStartAndEnd",
    outputs: [
      {
        internalType: "uint256",
        name: "start",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum IPeriodRegistry.PeriodType",
        name: "_periodType",
        type: "uint8",
      },
      {
        internalType: "uint256[]",
        name: "_periodStarts",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "_periodEnds",
        type: "uint256[]",
      },
    ],
    name: "initializePeriod",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum IPeriodRegistry.PeriodType",
        name: "_periodType",
        type: "uint8",
      },
    ],
    name: "isInitializedPeriod",
    outputs: [
      {
        internalType: "bool",
        name: "initialized",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum IPeriodRegistry.PeriodType",
        name: "_periodType",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "_periodId",
        type: "uint256",
      },
    ],
    name: "isValidPeriod",
    outputs: [
      {
        internalType: "bool",
        name: "valid",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum IPeriodRegistry.PeriodType",
        name: "",
        type: "uint8",
      },
    ],
    name: "periodDefinitions",
    outputs: [
      {
        internalType: "bool",
        name: "initialized",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum IPeriodRegistry.PeriodType",
        name: "_periodType",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "_periodId",
        type: "uint256",
      },
    ],
    name: "periodHasStarted",
    outputs: [
      {
        internalType: "bool",
        name: "started",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum IPeriodRegistry.PeriodType",
        name: "_periodType",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "_periodId",
        type: "uint256",
      },
    ],
    name: "periodIsFinished",
    outputs: [
      {
        internalType: "bool",
        name: "finished",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405260006100176001600160e01b0361006616565b600080546001600160a01b0319166001600160a01b0383169081178255604051929350917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908290a35061006a565b3390565b6117a6806100796000396000f3fe608060405234801561001057600080fd5b50600436106100b45760003560e01c8063a163f02011610071578063a163f0201461013a578063c7b6ceb41461014d578063d62e307514610160578063ddfc4fde14610175578063f2fde38b14610188578063ffa612351461019b576100b4565b80635c98d157146100b9578063715018a6146100e25780637a1d83bc146100ec5780638da5cb5b146100ff5780638fdec1da14610114578063963a470b14610127575b600080fd5b6100cc6100c7366004611327565b6101bc565b6040516100d991906114c3565b60405180910390f35b6100ea6101d1565b005b6100cc6100fa3660046113b8565b610263565b6101076102d7565b6040516100d9919061141c565b6100cc610122366004611327565b6102e6565b6100ea610135366004611342565b6103e9565b6100ea610148366004611342565b61060e565b6100cc61015b3660046113b8565b610818565b610168610878565b6040516100d99190611430565b6100cc6101833660046113b8565b610f92565b6100ea6101963660046112f9565b6110b1565b6101ae6101a93660046113b8565b611171565b6040516100d9929190611762565b60016020526000908152604090205460ff1681565b6101d9611203565b6001600160a01b03166101ea6102d7565b6001600160a01b0316146102195760405162461bcd60e51b815260040161021090611688565b60405180910390fd5b600080546040516001600160a01b03909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908390a3600080546001600160a01b0319169055565b600061026f8383610f92565b61028b5760405162461bcd60e51b81526004016102109061172b565b426001600085600581111561029c57fe5b60058111156102a757fe5b815260200190815260200160002060010183815481106102c357fe5b906000526020600020015410905092915050565b6000546001600160a01b031690565b60006102f0611234565b6001600084600581111561030057fe5b600581111561030b57fe5b815260208082019290925260409081016000208151606081018352815460ff1615158152600182018054845181870281018701909552808552919492938584019390929083018282801561037e57602002820191906000526020600020905b81548152602001906001019080831161036a575b50505050508152602001600282018054806020026020016040519081016040528092919081815260200182805480156103d657602002820191906000526020600020905b8154815260200190600101908083116103c2575b5050509190925250509051949350505050565b6103f1611203565b6001600160a01b03166104026102d7565b6001600160a01b0316146104285760405162461bcd60e51b815260040161021090611688565b60008251116104495760405162461bcd60e51b8152600401610210906116bd565b60006001600085600581111561045b57fe5b600581111561046657fe5b81526020810191909152604001600020805490915060ff1661049a5760405162461bcd60e51b815260040161021090611651565b60005b83518110156105cd578281815181106104b257fe5b60200260200101518482815181106104c657fe5b6020026020010151106104eb5760405162461bcd60e51b815260040161021090611555565b83516104fe90600163ffffffff61120716565b8110156105605761054183828151811061051457fe5b602002602001015185836001018151811061052b57fe5b602002602001015161120790919063ffffffff16565b6001146105605760405162461bcd60e51b8152600401610210906114e6565b8160010184828151811061057057fe5b60209081029190910181015182546001810184556000938452919092200155825160028301908490839081106105a257fe5b602090810291909101810151825460018181018555600094855292909320909201919091550161049d565b507f22453266e5e1e7468fee2b84c776e3bd5917bfd8a60abb3c0b95561bb22062da8484516040516106009291906114ce565b60405180910390a150505050565b610616611203565b6001600160a01b03166106276102d7565b6001600160a01b03161461064d5760405162461bcd60e51b815260040161021090611688565b60006001600085600581111561065f57fe5b600581111561066a57fe5b81526020810191909152604001600020805490915060ff161561069f5760405162461bcd60e51b8152600401610210906116f4565b81518351146106c05760405162461bcd60e51b8152600401610210906115d2565b60008351116106e15760405162461bcd60e51b8152600401610210906116bd565b60005b83518110156107d9578281815181106106f957fe5b602002602001015184828151811061070d57fe5b6020026020010151106107325760405162461bcd60e51b815260040161021090611555565b600184510381101561076c5761074d83828151811061051457fe5b60011461076c5760405162461bcd60e51b8152600401610210906114e6565b8160010184828151811061077c57fe5b60209081029190910181015182546001810184556000938452919092200155825160028301908490839081106107ae57fe5b60209081029190910181015182546001818101855560009485529290932090920191909155016106e4565b50805460ff1916600117815582516040517f2b0f2d8c9036efbd14cb23d06c56d37fca048c5062ada3454a3ab584762d630191610600918791906114ce565b60006108248383610f92565b6108405760405162461bcd60e51b81526004016102109061172b565b426001600085600581111561085157fe5b600581111561085c57fe5b815260200190815260200160002060020183815481106102c357fe5b60408051600680825260e08201909252606091829190816020015b61089b611234565b8152602001906001900390816108935750506000805260016020908152604080516060810182527fa6eef7e35abe7026729641147f7915573c7e97b47efa546f5f6e3230263bcb49805460ff16151582527fa6eef7e35abe7026729641147f7915573c7e97b47efa546f5f6e3230263bcb4a8054845181870281018701909552808552959650919490938581019392919083018282801561095b57602002820191906000526020600020905b815481526020019060010190808311610947575b50505050508152602001600282018054806020026020016040519081016040528092919081815260200182805480156109b357602002820191906000526020600020905b81548152602001906001019080831161099f575b505050505081525050816000815181106109c957fe5b602090810291909101810191909152600160008190528152604080516060810182527fcc69885fda6bcc1a4ace058b4a62bf5e179ea78fd58a1ccd71c22cc9b688792f805460ff16151582527fcc69885fda6bcc1a4ace058b4a62bf5e179ea78fd58a1ccd71c22cc9b6887930805484518187028101870190955280855292949193858301939092830182828015610a8057602002820191906000526020600020905b815481526020019060010190808311610a6c575b5050505050815260200160028201805480602002602001604051908101604052809291908181526020018280548015610ad857602002820191906000526020600020905b815481526020019060010190808311610ac4575b50505050508152505081600181518110610aee57fe5b602090810291909101810191909152600260005260018152604080516060810182527fd9d16d34ffb15ba3a3d852f0d403e2ce1d691fb54de27ac87cd2f993f3ec330f805460ff16151582527fd9d16d34ffb15ba3a3d852f0d403e2ce1d691fb54de27ac87cd2f993f3ec3310805484518187028101870190955280855292949193858301939092830182828015610ba557602002820191906000526020600020905b815481526020019060010190808311610b91575b5050505050815260200160028201805480602002602001604051908101604052809291908181526020018280548015610bfd57602002820191906000526020600020905b815481526020019060010190808311610be9575b50505050508152505081600281518110610c1357fe5b602090810291909101810191909152600360005260018152604080516060810182527f7dfe757ecd65cbd7922a9c0161e935dd7fdbcc0e999689c7d31633896b1fc60b805460ff16151582527f7dfe757ecd65cbd7922a9c0161e935dd7fdbcc0e999689c7d31633896b1fc60c805484518187028101870190955280855292949193858301939092830182828015610cca57602002820191906000526020600020905b815481526020019060010190808311610cb6575b5050505050815260200160028201805480602002602001604051908101604052809291908181526020018280548015610d2257602002820191906000526020600020905b815481526020019060010190808311610d0e575b50505050508152505081600381518110610d3857fe5b602090810291909101810191909152600460005260018152604080516060810182527fedc95719e9a3b28dd8e80877cb5880a9be7de1a13fc8b05e7999683b6b567643805460ff16151582527fedc95719e9a3b28dd8e80877cb5880a9be7de1a13fc8b05e7999683b6b567644805484518187028101870190955280855292949193858301939092830182828015610def57602002820191906000526020600020905b815481526020019060010190808311610ddb575b5050505050815260200160028201805480602002602001604051908101604052809291908181526020018280548015610e4757602002820191906000526020600020905b815481526020019060010190808311610e33575b50505050508152505081600481518110610e5d57fe5b602090810291909101810191909152600560005260018152604080516060810182527fe2689cd4a84e23ad2f564004f1c9013e9589d260bde6380aba3ca7e09e4df40c805460ff16151582527fe2689cd4a84e23ad2f564004f1c9013e9589d260bde6380aba3ca7e09e4df40d805484518187028101870190955280855292949193858301939092830182828015610f1457602002820191906000526020600020905b815481526020019060010190808311610f00575b5050505050815260200160028201805480602002602001604051908101604052809291908181526020018280548015610f6c57602002820191906000526020600020905b815481526020019060010190808311610f58575b50505050508152505081600581518110610f8257fe5b6020908102919091010152905090565b6000610f9c611234565b60016000856005811115610fac57fe5b6005811115610fb757fe5b815260208082019290925260409081016000208151606081018352815460ff1615158152600182018054845181870281018701909552808552919492938584019390929083018282801561102a57602002820191906000526020600020905b815481526020019060010190808311611016575b505050505081526020016002820180548060200260200160405190810160405280929190818152602001828054801561108257602002820191906000526020600020905b81548152602001906001019080831161106e575b5050505050815250509050826110a7600183602001515161120790919063ffffffff16565b1015949350505050565b6110b9611203565b6001600160a01b03166110ca6102d7565b6001600160a01b0316146110f05760405162461bcd60e51b815260040161021090611688565b6001600160a01b0381166111165760405162461bcd60e51b81526004016102109061158c565b600080546040516001600160a01b03808516939216917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e091a3600080546001600160a01b0319166001600160a01b0392909216919091179055565b6000806001600085600581111561118457fe5b600581111561118f57fe5b815260200190815260200160002060010183815481106111ab57fe5b90600052602060002001549150600160008560058111156111c857fe5b60058111156111d357fe5b815260200190815260200160002060020183815481106111ef57fe5b906000526020600020015490509250929050565b3390565b6000828211156112295760405162461bcd60e51b81526004016102109061161a565b508082035b92915050565b604051806060016040528060001515815260200160608152602001606081525090565b600082601f830112611267578081fd5b813567ffffffffffffffff8082111561127e578283fd5b60208083026040518282820101818110858211171561129b578687fd5b6040528481529450818501925085820181870183018810156112bc57600080fd5b600091505b848210156112df5780358452928201926001919091019082016112c1565b505050505092915050565b80356006811061122e57600080fd5b60006020828403121561130a578081fd5b81356001600160a01b0381168114611320578182fd5b9392505050565b600060208284031215611338578081fd5b61132083836112ea565b600080600060608486031215611356578182fd5b833560068110611364578283fd5b9250602084013567ffffffffffffffff80821115611380578384fd5b61138c87838801611257565b935060408601359150808211156113a1578283fd5b506113ae86828701611257565b9150509250925092565b600080604083850312156113ca578182fd5b6113d484846112ea565b946020939093013593505050565b6000815180845260208085019450808401835b83811015611411578151875295820195908201906001016113f5565b509495945050505050565b6001600160a01b0391909116815260200190565b6000602080830181845280855180835260408601915060408482028701019250838701855b828110156114b657603f1988860301845281516060815115158752878201518189890152611485828901826113e2565b60409250828401519150888103838a01526114a081836113e2565b9850505094870194505090850190600101611455565b5092979650505050505050565b901515815260200190565b60408101600684106114dc57fe5b9281526020015290565b60208082526049908201527f5374617274206f66206120706572696f642073686f756c64206265203120736560408201527f636f6e642061667465722074686520656e64206f66207468652070726576696f6060820152681d5cc81c195c9a5bd960ba1b608082015260a00190565b6020808252601a908201527f53746172742073686f756c64206265206265666f726520656e64000000000000604082015260600190565b60208082526026908201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160408201526564647265737360d01b606082015260800190565b60208082526028908201527f506572696f6420747970652073746172747320616e6420656e64732073686f756040820152670d8c840dac2e8c6d60c31b606082015260800190565b6020808252601e908201527f536166654d6174683a207375627472616374696f6e206f766572666c6f770000604082015260600190565b6020808252601e908201527f506572696f6420776173206e6f7420696e697469616c697a6564207965740000604082015260600190565b6020808252818101527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604082015260600190565b60208082526018908201527f506572696f64206c656e6774682063616e277420626520300000000000000000604082015260600190565b6020808252601f908201527f506572696f64207479706520616c726561647920696e697469616c697a656400604082015260600190565b60208082526018908201527f506572696f642064617461206973206e6f742076616c69640000000000000000604082015260600190565b91825260208201526040019056fea26469706673582212205f36367427d19f7035c738f069d525ccc0aaa94eebf0ce098cc2d2306eb729d864736f6c63430006060033";

export class PeriodRegistry__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<PeriodRegistry> {
    return super.deploy(overrides || {}) as Promise<PeriodRegistry>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): PeriodRegistry {
    return super.attach(address) as PeriodRegistry;
  }
  connect(signer: Signer): PeriodRegistry__factory {
    return super.connect(signer) as PeriodRegistry__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): PeriodRegistryInterface {
    return new utils.Interface(_abi) as PeriodRegistryInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): PeriodRegistry {
    return new Contract(address, _abi, signerOrProvider) as PeriodRegistry;
  }
}
