import { PeriodRegistry } from '../../typechain';
import { ethers, deployments } from 'hardhat';
import { CONTRACT_NAMES, DEPLOYMENT_TAGS } from '../../constants';
import { expect } from '../chai-setup';
import { PERIOD_TYPE } from '../../constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
const moment = require('moment');

const setup = deployments.createFixture(async () => {
  await deployments.fixture(DEPLOYMENT_TAGS.DSLA);
  const PeriodRegistry: PeriodRegistry = await ethers.getContract(
    CONTRACT_NAMES.PeriodRegistry
  );
  return {
    PeriodRegistry,
  };
});

type Fixture = {
  PeriodRegistry: PeriodRegistry;
};

const getPeriodStart = (months_to_add: number) => {
  return moment()
    .utc(0)
    .startOf('month')
    .add(months_to_add, 'month')
    .startOf('month')
    .unix();
}

const getPeriodEnd = (months_to_add: number) => {
  return moment()
    .utc(0)
    .endOf('month')
    .add(months_to_add, 'month')
    .endOf('month')
    .unix();
}

describe(CONTRACT_NAMES.PeriodRegistry, function () {
  let fixture: Fixture;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  before(async function () {
    [owner, user,] = await ethers.getSigners();
  })
  beforeEach(async function () {
    fixture = await setup();
  });

  describe('Initialize Period Definitions', function () {
    it('only owner can initialize period definitions', async function () {
      const { PeriodRegistry } = fixture;

      const periodStartExpected = getPeriodStart(1);
      const periodEndExpected = getPeriodEnd(10);
      await expect(
        PeriodRegistry.connect(user).initializePeriod(
          PERIOD_TYPE.MONTHLY,
          [periodStartExpected],
          [periodEndExpected]
        )
      ).to.be.revertedWith('Ownable: caller is not the owner');
      await expect(
        PeriodRegistry.initializePeriod(
          PERIOD_TYPE.MONTHLY,
          [periodStartExpected],
          [periodEndExpected]
        )
      ).to.emit(PeriodRegistry, 'PeriodInitialized')
        .withArgs(PERIOD_TYPE.MONTHLY, 1);
    })
    it('should initialize a period with correct start and end', async function () {
      const { PeriodRegistry } = fixture;
      const periodStartExpected = getPeriodStart(1);
      const periodEndExpected = getPeriodEnd(10);
      await PeriodRegistry.initializePeriod(
        PERIOD_TYPE.MONTHLY,
        [periodStartExpected],
        [periodEndExpected]
      );

      const period = await PeriodRegistry.getPeriodStartAndEnd(
        PERIOD_TYPE.MONTHLY,
        0
      );
      const periodStartActual = period.start.toNumber();
      const periodEndActual = period.end.toNumber();
      expect(periodStartActual).to.be.equal(periodStartExpected);
      expect(periodEndActual).to.be.equal(periodEndExpected);
    });
    it('should return true because the period is valid', async function () {
      const { PeriodRegistry } = fixture;
      const periodStartExpected = getPeriodStart(1);
      const periodEndExpected = getPeriodEnd(10);
      await PeriodRegistry.initializePeriod(
        PERIOD_TYPE.DAILY,
        [periodStartExpected],
        [periodEndExpected]
      );
      const isValidPeriod = await PeriodRegistry.isValidPeriod(
        PERIOD_TYPE.DAILY,
        0
      );
      expect(isValidPeriod).to.be.true;
    });
    it('should return false because the period is not valid', async function () {
      const { PeriodRegistry } = fixture;
      const periodStartExpected = getPeriodStart(1)
      const periodEndExpected = getPeriodEnd(10)
      await PeriodRegistry.initializePeriod(
        PERIOD_TYPE.DAILY,
        [periodStartExpected],
        [periodEndExpected]
      )
      const isValidPeriod = await PeriodRegistry.isValidPeriod(
        PERIOD_TYPE.DAILY,
        1
      );
      expect(isValidPeriod).to.be.false;
    });
    it('should return true because the period is initialized', async function () {
      const { PeriodRegistry } = fixture;

      const periodStartExpected = getPeriodStart(1);
      const periodEndExpected = getPeriodEnd(10);
      await PeriodRegistry.initializePeriod(
        PERIOD_TYPE.DAILY,
        [periodStartExpected],
        [periodEndExpected]
      );
      const isInitializedPeriod = await PeriodRegistry.isInitializedPeriod(
        PERIOD_TYPE.DAILY
      );
      expect(isInitializedPeriod).to.be.true;
    });
    it('should return false because the period is not initialized', async function () {
      const { PeriodRegistry } = fixture;

      const isInitializedPeriod = await PeriodRegistry.isInitializedPeriod(
        PERIOD_TYPE.HOURLY
      );
      expect(isInitializedPeriod).to.be.false;
    });
    it('should revert initialization if the array is empty', async function () {
      const { PeriodRegistry } = fixture;
      await expect(PeriodRegistry.initializePeriod(
        PERIOD_TYPE.DAILY,
        [],
        []
      )).to.be.revertedWith("Period length can't be 0");
    });
    it('should revert initialization if start of a period is not 1 second after the end of the previous period', async function () {
      const { PeriodRegistry } = fixture;

      const periodStartExpected = getPeriodStart(1);
      const periodEndExpected = getPeriodEnd(10);
      await expect(
        PeriodRegistry.initializePeriod(
          PERIOD_TYPE.MONTHLY,
          [periodStartExpected, periodEndExpected + 2],
          [periodEndExpected, periodEndExpected + 1000]
        )
      ).to.be.revertedWith('Start of a period should be 1 second after the end of the previous period');
      await expect(
        PeriodRegistry.initializePeriod(
          PERIOD_TYPE.MONTHLY,
          [periodStartExpected, periodEndExpected + 1],
          [periodEndExpected, periodEndExpected + 1000]
        )
      ).to.emit(PeriodRegistry, 'PeriodInitialized')
        .withArgs(PERIOD_TYPE.MONTHLY, 2);
    });
    it('should revert initialization if start and end arrays length mismatch', async function () {
      const { PeriodRegistry } = fixture;

      const periodStartExpected = getPeriodStart(1);
      const periodEndExpected = getPeriodEnd(10);
      await expect(
        PeriodRegistry.initializePeriod(
          PERIOD_TYPE.MONTHLY,
          [periodStartExpected, periodEndExpected + 1],
          [periodEndExpected]
        )
      ).to.be.revertedWith('Period length in start and end arrays should match');
    });
    it('should revert initialization if it is already initialized', async function () {
      const { PeriodRegistry } = fixture;

      const periodStartExpected = getPeriodStart(1);
      const periodEndExpected = getPeriodEnd(10);
      await PeriodRegistry.initializePeriod(
        PERIOD_TYPE.MONTHLY,
        [periodStartExpected],
        [periodEndExpected]
      )
      await expect(
        PeriodRegistry.initializePeriod(
          PERIOD_TYPE.MONTHLY,
          [periodStartExpected],
          [periodEndExpected]
        )
      ).to.be.revertedWith('Period type already initialized');
    });
  })
  describe('Modify Period Definitions', function () {
    it('only owner can modify period definitions', async function () {
      const { PeriodRegistry } = fixture;
      const periodStartMonthlyExpected = getPeriodStart(1);
      const periodEndMonthlyExpected = getPeriodEnd(10);
      const periodStartExpected = getPeriodStart(11)
      const periodEndExpected = getPeriodEnd(20);
      await PeriodRegistry.initializePeriod(
        PERIOD_TYPE.MONTHLY,
        [periodStartMonthlyExpected],
        [periodEndMonthlyExpected]
      )
      await expect(
        PeriodRegistry.connect(user).addPeriodsToPeriodType(
          PERIOD_TYPE.MONTHLY,
          [periodStartExpected],
          [periodEndExpected]
        )
      ).to.be.revertedWith('Ownable: caller is not the owner')
      await expect(
        PeriodRegistry.connect(owner).addPeriodsToPeriodType(
          PERIOD_TYPE.MONTHLY,
          [periodStartExpected],
          [periodEndExpected]
        )
      ).to.emit(PeriodRegistry, 'PeriodModified')
        .withArgs(PERIOD_TYPE.MONTHLY, 1);
    })
    it('should modify an already initialized period', async function () {
      const { PeriodRegistry } = fixture;
      const periodStartMonthlyExpected = getPeriodStart(1);
      const periodEndMonthlyExpected = getPeriodEnd(10);
      const periodStartExpected = getPeriodStart(11);
      const periodEndExpected = getPeriodEnd(20);
      await PeriodRegistry.initializePeriod(
        PERIOD_TYPE.MONTHLY,
        [periodStartMonthlyExpected],
        [periodEndMonthlyExpected]
      )

      await expect(
        PeriodRegistry.addPeriodsToPeriodType(
          PERIOD_TYPE.MONTHLY,
          [periodStartExpected],
          [periodEndExpected]
        )
      ).to.emit(PeriodRegistry, 'PeriodModified')
        .withArgs(PERIOD_TYPE.MONTHLY, 1);

      const period = await PeriodRegistry.getPeriodStartAndEnd(
        PERIOD_TYPE.MONTHLY,
        1
      );
      const periodStartActual = period.start.toNumber();
      const periodEndActual = period.end.toNumber();

      expect(periodStartActual).to.be.equal(periodStartExpected);
      expect(periodEndActual).to.be.equal(periodEndExpected);
    });
    it('should revert modification if not initialized yet', async function () {
      const { PeriodRegistry } = fixture;

      const periodStartMonthlyExpected = getPeriodStart(1)
      const periodEndMonthlyExpected = getPeriodEnd(10)
      await expect(
        PeriodRegistry.addPeriodsToPeriodType(
          PERIOD_TYPE.MONTHLY,
          [periodStartMonthlyExpected],
          [periodEndMonthlyExpected]
        )
      ).to.be.revertedWith('Period was not initialized yet');
    });
    it('should revert modification if start of a period is not 1 second after the end of the previous period', async function () {
      const { PeriodRegistry } = fixture;

      const periodStartMonthlyExpected = getPeriodStart(1)
      const periodEndMonthlyExpected = getPeriodEnd(10)
      const periodStartExpected = getPeriodStart(11);
      const periodEndExpected = getPeriodEnd(20);
      await expect(
        PeriodRegistry.initializePeriod(
          PERIOD_TYPE.MONTHLY,
          [periodStartMonthlyExpected],
          [periodEndMonthlyExpected]
        )
      ).to.emit(PeriodRegistry, 'PeriodInitialized')
        .withArgs(PERIOD_TYPE.MONTHLY, 1);

      await expect(
        PeriodRegistry.addPeriodsToPeriodType(
          PERIOD_TYPE.MONTHLY,
          [periodStartExpected, periodEndExpected + 2],
          [periodEndExpected, periodEndExpected + 1000]
        )
      ).to.be.revertedWith('Start of a period should be 1 second after the end of the previous period');
      await expect(
        PeriodRegistry.addPeriodsToPeriodType(
          PERIOD_TYPE.MONTHLY,
          [periodStartExpected, periodEndExpected + 1],
          [periodEndExpected, periodEndExpected + 1000]
        )
      ).to.emit(PeriodRegistry, 'PeriodModified')
        .withArgs(PERIOD_TYPE.MONTHLY, 2);

      let period = await PeriodRegistry.getPeriodStartAndEnd(
        PERIOD_TYPE.MONTHLY,
        1
      );
      let periodStartActual = period.start.toNumber();
      let periodEndActual = period.end.toNumber();

      expect(periodStartActual).to.be.equal(periodStartExpected);
      expect(periodEndActual).to.be.equal(periodEndExpected);
    });

    it('should return true because the period is finished', async function () {
      const { PeriodRegistry } = fixture;

      const periodStartExpected = moment()
        .utc(0)
        .startOf('day')
        .subtract(20, 'day')
        .startOf('day')
        .unix();
      const periodEndExpected = moment()
        .utc(0)
        .endOf('day')
        .subtract(10, 'day')
        .endOf('day')
        .unix();
      await PeriodRegistry.initializePeriod(
        PERIOD_TYPE.DAILY,
        [periodStartExpected],
        [periodEndExpected]
      );
      await expect(PeriodRegistry.periodIsFinished(
        PERIOD_TYPE.DAILY,
        100
      )).to.be.revertedWith('Period data is not valid');

      const isPeriodIsFinished = await PeriodRegistry.periodIsFinished(
        PERIOD_TYPE.DAILY,
        0
      );
      expect(isPeriodIsFinished).to.be.true;
    });

    it('should return false because the period is not finished', async function () {
      const { PeriodRegistry } = fixture;

      const periodStartExpected = moment()
        .utc(0)
        .startOf('day')
        .add(1, 'day')
        .startOf('day')
        .unix();
      const periodEndExpected = moment()
        .utc(0)
        .endOf('day')
        .add(10, 'day')
        .endOf('day')
        .unix();
      await expect(
        PeriodRegistry.initializePeriod(
          PERIOD_TYPE.DAILY,
          [periodStartExpected],
          [periodEndExpected]
        )
      ).to.emit(PeriodRegistry, 'PeriodInitialized')
        .withArgs(PERIOD_TYPE.DAILY, 1);
      let isPeriodIsFinished = await PeriodRegistry.periodIsFinished(
        PERIOD_TYPE.DAILY,
        0
      );
      expect(isPeriodIsFinished).to.be.false;
    });

    it('should revert start should be before end', async function () {
      const { PeriodRegistry } = fixture;

      let periodStartExpected = moment()
        .utc(0)
        .startOf('day')
        .add(20, 'day')
        .startOf('day')
        .unix();
      let periodEndExpected = moment()
        .utc(0)
        .endOf('day')
        .add(10, 'day')
        .endOf('day')
        .unix();
      await expect(
        PeriodRegistry.initializePeriod(
          PERIOD_TYPE.DAILY,
          [periodStartExpected],
          [periodEndExpected]
        )
      ).to.be.revertedWith('Start should be before end');
    });

    it('should be false because period has not started', async function () {
      const { PeriodRegistry } = fixture;

      const periodStartExpected = moment()
        .utc(0)
        .startOf('day')
        .add(10, 'day')
        .startOf('day')
        .unix();
      const periodEndExpected = moment()
        .utc(0)
        .endOf('day')
        .add(20, 'day')
        .endOf('day')
        .unix();

      await expect(
        PeriodRegistry.initializePeriod(
          PERIOD_TYPE.DAILY,
          [periodStartExpected],
          [periodEndExpected]
        )
      ).to.emit(PeriodRegistry, 'PeriodInitialized')
        .withArgs(PERIOD_TYPE.DAILY, 1);
      const periodHasStarted = await PeriodRegistry.periodHasStarted(
        PERIOD_TYPE.DAILY,
        0
      );
      expect(periodHasStarted).to.be.false;
    });

    it('should be true because period has started', async function () {
      const { PeriodRegistry } = fixture;

      const periodStartExpected = moment()
        .utc(0)
        .startOf('day')
        .add(0, 'day')
        .startOf('day')
        .unix();
      const periodEndExpected = moment()
        .utc(0)
        .endOf('day')
        .add(20, 'day')
        .endOf('day')
        .unix();

      await PeriodRegistry.initializePeriod(
        PERIOD_TYPE.DAILY,
        [periodStartExpected],
        [periodEndExpected]
      );
      await expect(PeriodRegistry.periodHasStarted(
        PERIOD_TYPE.DAILY,
        100
      )).to.be.revertedWith('Period data is not valid')
      const periodHasStarted = await PeriodRegistry.periodHasStarted(
        PERIOD_TYPE.DAILY,
        0
      );
      expect(periodHasStarted).to.be.true;
    });

    it('should get period definitions', async function () {
      const { PeriodRegistry } = fixture;

      const periodStartMonthlyExpected = getPeriodStart(1)
      const periodEndMonthlyExpected = getPeriodStart(10)
      await PeriodRegistry.initializePeriod(
        PERIOD_TYPE.MONTHLY,
        [periodStartMonthlyExpected],
        [periodEndMonthlyExpected]
      )

      let periodStartDailyExpected = moment()
        .utc(0)
        .startOf('day')
        .add(1, 'day')
        .startOf('day')
        .unix();
      let periodEndDailyExpected = moment()
        .utc(0)
        .endOf('day')
        .add(10, 'day')
        .endOf('day')
        .unix();

      await expect(
        PeriodRegistry.initializePeriod(
          PERIOD_TYPE.DAILY,
          [periodStartDailyExpected],
          [periodEndDailyExpected]
        )
      ).to.emit(PeriodRegistry, 'PeriodInitialized')
        .withArgs(PERIOD_TYPE.DAILY, 1);

      let periodDefinition = await PeriodRegistry.getPeriodDefinitions();

      expect(periodDefinition[0].initialized).to.be.false;
      expect(periodDefinition[1].initialized).to.be.true;
      expect(periodDefinition[2].initialized).to.be.false;
      expect(periodDefinition[3].initialized).to.be.false;
      expect(periodDefinition[4].initialized).to.be.true;

      expect(periodDefinition[4].starts[0]).to.be.equal(
        periodStartMonthlyExpected
      );
      expect(periodDefinition[4].ends[0]).to.be.equal(periodEndMonthlyExpected);
      expect(periodDefinition[1].starts[0]).to.be.equal(periodStartDailyExpected);
      expect(periodDefinition[1].ends[0]).to.be.equal(periodEndDailyExpected);
    });

    it('should revert getting period start and end when period id does not exist', async function () {
      const { PeriodRegistry } = fixture;
      const periodStartExpected = getPeriodStart(1)
      const periodEndExpected = getPeriodStart(10)
      await PeriodRegistry.initializePeriod(
        PERIOD_TYPE.MONTHLY,
        [periodStartExpected],
        [periodEndExpected]
      );
      await expect(PeriodRegistry.getPeriodStartAndEnd(
        PERIOD_TYPE.MONTHLY,
        100
      )).to.be.revertedWith('Invalid period id');
      const period = await PeriodRegistry.getPeriodStartAndEnd(
        PERIOD_TYPE.MONTHLY,
        0
      );

      const periodStartActual = period.start.toNumber();
      const periodEndActual = period.end.toNumber();
      expect(periodStartActual).to.be.equal(periodStartExpected);
      expect(periodEndActual).to.be.equal(periodEndExpected);
    })
  })
});
