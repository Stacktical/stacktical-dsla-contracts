// const { toWei, utf8ToHex } = web3.utils;

// const initialTokenSupply = '100';
// const stakeAmount1 = toWei(String(initialTokenSupply / 10));
// const stakeAmount2 = toWei(String(initialTokenSupply / 5));

// it('should ask for active pool correctly', async () => {
//   const [sla] = SLAs;
//   await sla.addAllowedTokens(dai.address);
//
//   // with owner
//   await bDSLA.approve(sla.address, stakeAmount1);
//   await dai.approve(sla.address, stakeAmount2);
//   await sla.stakeTokens(stakeAmount1, bDSLA.address, periodId);
//   await sla.stakeTokens(stakeAmount2, dai.address, periodId);
//
//   const slaStakedByOwner = await slaRegistry.slaWasStakedByUser(
//     owner,
//     sla.address,
//   );
//   // eslint-disable-next-line no-unused-expressions
//   expect(slaStakedByOwner).to.be.true;
//
//   let activePools = await slaRegistry.getActivePool.call(owner);
//   assert.equal(
//     activePools.length,
//     2,
//     'active pools should only be equal to SLAs length',
//   );
//
//   let [pool1, pool2] = activePools;
//   let bDSLAName = await bDSLA.name.call();
//   let daiName = await dai.name.call();
//
//   assert.equal(pool1.stake, stakeAmount1, 'stakes for SLA 1 does not match');
//   assert.equal(pool2.stake, stakeAmount2, 'stakes for SLA 2 does not match');
//   assert.equal(
//     cleanSolidityString(pool1.assetName),
//     bDSLAName,
//     'names for SLA 1 does not match',
//   );
//   assert.equal(
//     cleanSolidityString(pool2.assetName),
//     daiName,
//     'names for SLA 2 does not match',
//   );
//   assert.equal(
//     pool1.SLAaddress,
//     sla.address,
//     'addresses for pool 1 does not match',
//   );
//   assert.equal(
//     pool2.SLAaddress,
//     sla.address,
//     'addresses for pool 2 does not match',
//   );
//
//   // with notOwner
//   await bDSLA.approve(sla.address, stakeAmount1, { from: notOwner });
//   await dai.approve(sla.address, stakeAmount2, { from: notOwner });
//   await sla.stakeTokens(stakeAmount1, bDSLA.address, periodId, {
//     from: notOwner,
//   });
//   await sla.stakeTokens(stakeAmount2, dai.address, periodId, {
//     from: notOwner,
//   });
//
//   // for notOwner
//   activePools = await slaRegistry.getActivePool.call(notOwner);
//   assert.equal(
//     activePools.length,
//     2,
//     'active pools should only be equal to SLAs length',
//   );
//   [pool1, pool2] = activePools;
//   bDSLAName = await bDSLA.name.call({ from: notOwner });
//   daiName = await dai.name.call({ from: notOwner });
//
//   assert.equal(pool1.stake, stakeAmount1, 'stakes for SLA 1 does not match');
//   assert.equal(pool2.stake, stakeAmount2, 'stakes for SLA 2 does not match');
//   assert.equal(
//     cleanSolidityString(pool1.assetName),
//     bDSLAName,
//     'names for SLA 1 does not match',
//   );
//   assert.equal(
//     cleanSolidityString(pool2.assetName),
//     daiName,
//     'names for SLA 2 does not match',
//   );
//   assert.equal(
//     pool1.SLAaddress,
//     sla.address,
//     'addresses for pool 1 does not match',
//   );
//   assert.equal(
//     pool2.SLAaddress,
//     sla.address,
//     'addresses for pool 2 does not match',
//   );
// });
