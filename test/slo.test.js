/* eslint no-await-in-loop: 0 */
/* eslint no-unused-expressions: 0 */

import { expect } from 'chai';
import { sloTypes, sloTypesNames } from '../constants';

const SLO = artifacts.require('SLO');

const sloValue = 97000;

describe('SLO', () => {
  it('should check if the SLO was honored correctly', async () => {
    for (const sloType of sloTypes) {
      let slo;
      let honored;
      switch (sloType) {
        case sloTypesNames.EqualTo: {
          slo = await SLO.new(sloValue, 0);
          honored = await slo.isRespected.call(sloValue + 1);
          expect(honored).to.be.false;
          honored = await slo.isRespected.call(sloValue - 1);
          expect(honored).to.be.false;
          honored = await slo.isRespected.call(sloValue);
          expect(honored).to.be.true;
          break;
        }
        case sloTypesNames.NotEqualTo: {
          slo = await SLO.new(sloValue, 1);
          honored = await slo.isRespected.call(sloValue + 1);
          expect(honored).to.be.true;
          honored = await slo.isRespected.call(sloValue - 1);
          expect(honored).to.be.true;
          honored = await slo.isRespected.call(sloValue);
          expect(honored).to.be.false;

          break;
        }
        case sloTypesNames.SmallerThan: {
          slo = await SLO.new(sloValue, 2);
          honored = await slo.isRespected.call(sloValue + 1);
          expect(honored).to.be.false;
          honored = await slo.isRespected.call(sloValue - 1);
          expect(honored).to.be.true;
          honored = await slo.isRespected.call(sloValue);
          expect(honored).to.be.false;

          break;
        }
        case sloTypesNames.SmallerOrEqualTo: {
          slo = await SLO.new(sloValue, 3);
          honored = await slo.isRespected.call(sloValue + 1);
          expect(honored).to.be.false;
          honored = await slo.isRespected.call(sloValue - 1);
          expect(honored).to.be.true;
          honored = await slo.isRespected.call(sloValue);
          expect(honored).to.be.true;

          break;
        }
        case sloTypesNames.GreaterThan: {
          slo = await SLO.new(sloValue, 4);
          honored = await slo.isRespected.call(sloValue + 1);
          expect(honored).to.be.true;
          honored = await slo.isRespected.call(sloValue - 1);
          expect(honored).to.be.false;
          honored = await slo.isRespected.call(sloValue);
          expect(honored).to.be.false;

          break;
        }
        case sloTypesNames.GreaterOrEqualTo: {
          slo = await SLO.new(sloValue, 5);
          honored = await slo.isRespected.call(sloValue + 1);
          expect(honored).to.be.true;
          honored = await slo.isRespected.call(sloValue - 1);
          expect(honored).to.be.false;
          honored = await slo.isRespected.call(sloValue);
          expect(honored).to.be.true;

          break;
        }
        default:
          break;
      }
    }
  });

  // it('should return details correctly', async () => {
  //   const slo = await SLO.new(sloValue, 4);
  //   const details = await slo.getDetails();
  //   console.log(details);
  // });
});
