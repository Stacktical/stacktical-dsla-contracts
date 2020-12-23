const { toWei } = web3.utils;

export const slaConstructor = {
  _owner: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", // not used
  _SLONames: [
    "0x7374616b696e675f656666696369656e63790000000000000000000000000000",
  ],
  _SLOs: ["0x7f0A3d2BC5DcCE0936153eF5C592D5d5fF3c4551"],
  _stake: toWei("0"),
  _ipfsHash: "QmWngSpudqbLSPxd5VhN5maSKRmjZvTjapfFYig5qqkwTS",
  _sliInterval: "604800",
  _tokenAddress: "0x653157C7B46A81F106Ae0990E9B23DBFEAA0145F", // not used
  _sla_period_starts: [
    "1602633600",
    "1603238400",
    "1603843200",
    "1604448000",
    "1605052800",
  ],
  _sla_period_ends: [
    "1603238400",
    "1603843200",
    "1604448000",
    "1605052800",
    "1605657600",
  ],
};

export const sloTypes = [
  "EqualTo",
  "NotEqualTo",
  "SmallerThan",
  "SmallerOrEqualTo",
  "GreaterThan",
  "GreaterOrEqualTo",
];
