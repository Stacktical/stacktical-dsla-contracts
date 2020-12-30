/* eslint no-await-in-loop: 0 */
/* eslint no-unused-expressions: 0 */

import { expect } from 'chai';
import { sloTypes, sloTypesNames } from './helpers/constants';

const SLO = artifacts.require('SLO');
const { utf8ToHex } = web3.utils;

const sloName = utf8ToHex('staking_efficiency');
const sloValue = 97000;

describe('SLO', () => {
  it('should check if the SLO was honored correctly', async () => {
    for (const sloType of sloTypes) {
      let slo;
      let honored;
      switch (sloType) {
        case sloTypesNames.EqualTo: {
          slo = await SLO.new(sloValue, 0, sloName);
          honored = await slo.isSLOHonored.call(sloValue + 1);
          expect(honored).to.be.false;
          honored = await slo.isSLOHonored.call(sloValue - 1);
          expect(honored).to.be.false;
          honored = await slo.isSLOHonored.call(sloValue);
          expect(honored).to.be.true;
          break;
        }
        case sloTypesNames.NotEqualTo: {
          slo = await SLO.new(sloValue, 1, sloName);
          honored = await slo.isSLOHonored.call(sloValue + 1);
          expect(honored).to.be.true;
          honored = await slo.isSLOHonored.call(sloValue - 1);
          expect(honored).to.be.true;
          honored = await slo.isSLOHonored.call(sloValue);
          expect(honored).to.be.false;

          break;
        }
        case sloTypesNames.SmallerThan: {
          slo = await SLO.new(sloValue, 2, sloName);
          honored = await slo.isSLOHonored.call(sloValue + 1);
          expect(honored).to.be.false;
          honored = await slo.isSLOHonored.call(sloValue - 1);
          expect(honored).to.be.true;
          honored = await slo.isSLOHonored.call(sloValue);
          expect(honored).to.be.false;

          break;
        }
        case sloTypesNames.SmallerOrEqualTo: {
          slo = await SLO.new(sloValue, 3, sloName);
          honored = await slo.isSLOHonored.call(sloValue + 1);
          expect(honored).to.be.false;
          honored = await slo.isSLOHonored.call(sloValue - 1);
          expect(honored).to.be.true;
          honored = await slo.isSLOHonored.call(sloValue);
          expect(honored).to.be.true;

          break;
        }
        case sloTypesNames.GreaterThan: {
          slo = await SLO.new(sloValue, 4, sloName);
          honored = await slo.isSLOHonored.call(sloValue + 1);
          expect(honored).to.be.true;
          honored = await slo.isSLOHonored.call(sloValue - 1);
          expect(honored).to.be.false;
          honored = await slo.isSLOHonored.call(sloValue);
          expect(honored).to.be.false;

          break;
        }
        case sloTypesNames.GreaterOrEqualTo: {
          slo = await SLO.new(sloValue, 5, sloName);
          honored = await slo.isSLOHonored.call(sloValue + 1);
          expect(honored).to.be.true;
          honored = await slo.isSLOHonored.call(sloValue - 1);
          expect(honored).to.be.false;
          honored = await slo.isSLOHonored.call(sloValue);
          expect(honored).to.be.true;

          break;
        }
        default:
          break;
      }
    }
  });
});
