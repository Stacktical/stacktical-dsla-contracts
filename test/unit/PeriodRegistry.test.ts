import { PeriodRegistry } from '../../typechain';
import { ethers, deployments } from 'hardhat';
import { CONTRACT_NAMES, DEPLOYMENT_TAGS } from '../../constants';
import { expect } from '../chai-setup';
import { PERIOD_TYPE } from '../../constants';
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

const getPeriodStart = () => {
  return moment()
    .utc(0)
    .startOf('month')
    .add(1, 'month')
    .startOf('month')
    .unix();
}

const getPeriodEnd = () => {
  return moment()
    .utc(0)
    .endOf('month')
    .add(10, 'month')
    .endOf('month')
    .unix();
}

describe(CONTRACT_NAMES.PeriodRegistry, function () {
  let fixture: Fixture;
  let deployer: string;
  beforeEach(async function () {
    fixture = await setup();
  });

  it('should initialize a period with correct start and end', async function () {
    const { PeriodRegistry } = fixture;

    const periodStartExpected = getPeriodStart();
    const periodEndExpected = getPeriodEnd();
    await expect(
      PeriodRegistry.initializePeriod(
        PERIOD_TYPE.MONTHLY,
        [periodStartExpected],
        [periodEndExpected]
      )
    ).to.emit(PeriodRegistry, 'PeriodInitialized')
      .withArgs(PERIOD_TYPE.MONTHLY, 1);
    let period = await PeriodRegistry.getPeriodStartAndEnd(
      PERIOD_TYPE.MONTHLY,
      0
    );

    const periodStartActual = period.start.toNumber();
    const periodEndActual = period.end.toNumber();
    expect(periodStartActual).to.be.equal(periodStartExpected);
    expect(periodEndActual).to.be.equal(periodEndExpected);
  });

  it('should revert initialization if start of a period is not 1 second after the end of the previous period', async function () {
    const { PeriodRegistry } = fixture;

    const periodStartExpected = getPeriodStart();
    const periodEndExpected = getPeriodEnd();
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

  it('should modify an already initialized period', async function () {
    const { PeriodRegistry } = fixture;

    let periodStartMonthlyExpected = getPeriodStart();
    let periodEndMonthlyExpected = getPeriodEnd();
    await expect(
      PeriodRegistry.initializePeriod(
        PERIOD_TYPE.MONTHLY,
        [periodStartMonthlyExpected],
        [periodEndMonthlyExpected]
      )
    ).to.emit(PeriodRegistry, 'PeriodInitialized')
      .withArgs(PERIOD_TYPE.MONTHLY, 1);
    let periodStartExpected = moment()
      .utc(0)
      .startOf('month')
      .add(11, 'month')
      .startOf('month')
      .unix();
    let periodEndExpected = moment()
      .utc(0)
      .endOf('month')
      .add(20, 'month')
      .endOf('month')
      .unix();

    await expect(
      PeriodRegistry.addPeriodsToPeriodType(
        PERIOD_TYPE.MONTHLY,
        [periodStartExpected],
        [periodEndExpected]
      )
    ).to.emit(PeriodRegistry, 'PeriodModified')
      .withArgs(PERIOD_TYPE.MONTHLY, 1);

    let period = await PeriodRegistry.getPeriodStartAndEnd(
      PERIOD_TYPE.MONTHLY,
      1
    );
    let periodStartActual = period.start.toNumber();
    let periodEndActual = period.end.toNumber();

    expect(periodStartActual).to.be.equal(periodStartExpected);
    expect(periodEndActual).to.be.equal(periodEndExpected);
  });

  it('should revert modification if start of a period is not 1 second after the end of the previous period', async function () {
    const { PeriodRegistry } = fixture;

    const periodStartMonthlyExpected = getPeriodStart()
    const periodEndMonthlyExpected = getPeriodEnd()
    await expect(
      PeriodRegistry.initializePeriod(
        PERIOD_TYPE.MONTHLY,
        [periodStartMonthlyExpected],
        [periodEndMonthlyExpected]
      )
    ).to.emit(PeriodRegistry, 'PeriodInitialized')
      .withArgs(PERIOD_TYPE.MONTHLY, 1);
    const periodStartExpected = moment()
      .utc(0)
      .startOf('month')
      .add(11, 'month')
      .startOf('month')
      .unix();
    const periodEndExpected = moment()
      .utc(0)
      .endOf('month')
      .add(20, 'month')
      .endOf('month')
      .unix();

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

  it('should return true because the period is initialized', async function () {
    const { PeriodRegistry } = fixture;

    let periodStartExpected = getPeriodStart();
    let periodEndExpected = getPeriodEnd();
    await expect(
      PeriodRegistry.initializePeriod(
        PERIOD_TYPE.DAILY,
        [periodStartExpected],
        [periodEndExpected]
      )
    ).to.emit(PeriodRegistry, 'PeriodInitialized')
      .withArgs(PERIOD_TYPE.DAILY, 1);
    let isInitializedPeriod = await PeriodRegistry.isInitializedPeriod(
      PERIOD_TYPE.DAILY
    );
    expect(isInitializedPeriod).to.be.true;
  });

  it('should return false because the period is not initialized', async function () {
    const { PeriodRegistry } = fixture;

    let isInitializedPeriod = await PeriodRegistry.isInitializedPeriod(
      PERIOD_TYPE.HOURLY
    );
    expect(isInitializedPeriod).to.be.false;
  });

  it('should return true because the period is valid', async function () {
    const { PeriodRegistry } = fixture;

    let periodStartExpected = getPeriodStart();
    let periodEndExpected = getPeriodEnd();
    await expect(
      PeriodRegistry.initializePeriod(
        PERIOD_TYPE.DAILY,
        [periodStartExpected],
        [periodEndExpected]
      )
    ).to.emit(PeriodRegistry, 'PeriodInitialized')
      .withArgs(PERIOD_TYPE.DAILY, 1);
    let isValidPeriod = await PeriodRegistry.isValidPeriod(
      PERIOD_TYPE.DAILY,
      0
    );
    expect(isValidPeriod).to.be.true;
  });

  it('should return false because the period is not valid', async function () {
    const { PeriodRegistry } = fixture;

    const periodStartExpected = getPeriodStart()
    const periodEndExpected = getPeriodEnd()
    await expect(
      PeriodRegistry.initializePeriod(
        PERIOD_TYPE.DAILY,
        [periodStartExpected],
        [periodEndExpected]
      )
    ).to.emit(PeriodRegistry, 'PeriodInitialized')
      .withArgs(PERIOD_TYPE.DAILY, 1);
    const isValidPeriod = await PeriodRegistry.isValidPeriod(
      PERIOD_TYPE.DAILY,
      1
    );
    expect(isValidPeriod).to.be.false;
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
    await expect(
      PeriodRegistry.initializePeriod(
        PERIOD_TYPE.DAILY,
        [periodStartExpected],
        [periodEndExpected]
      )
    ).to.emit(PeriodRegistry, 'PeriodInitialized')
      .withArgs(PERIOD_TYPE.DAILY, 1);
    const isPeriodIsFinished = await PeriodRegistry.periodIsFinished(
      PERIOD_TYPE.DAILY,
      0
    );
    expect(isPeriodIsFinished).to.be.true;
  });

  it('should return false because the period is not finished', async function () {
    const { PeriodRegistry } = fixture;

    let periodStartExpected = moment()
      .utc(0)
      .startOf('day')
      .add(1, 'day')
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
    ).to.be.reverted;
  });

  it('should be false because period has not started', async function () {
    const { PeriodRegistry } = fixture;

    let periodStartExpected = moment()
      .utc(0)
      .startOf('day')
      .add(10, 'day')
      .startOf('day')
      .unix();
    let periodEndExpected = moment()
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
    let periodHasStarted = await PeriodRegistry.periodHasStarted(
      PERIOD_TYPE.DAILY,
      0
    );
    expect(periodHasStarted).to.be.false;
  });

  it('should be true because period has started', async function () {
    const { PeriodRegistry } = fixture;

    let periodStartExpected = moment()
      .utc(0)
      .startOf('day')
      .add(0, 'day')
      .startOf('day')
      .unix();
    let periodEndExpected = moment()
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
    let periodHasStarted = await PeriodRegistry.periodHasStarted(
      PERIOD_TYPE.DAILY,
      0
    );
    expect(periodHasStarted).to.be.true;
  });

  it('should get period definitions', async function () {
    const { PeriodRegistry } = fixture;

    let periodStartMonthlyExpected = moment()
      .utc(0)
      .startOf('month')
      .add(1, 'month')
      .startOf('month')
      .unix();
    let periodEndMonthlyExpected = moment()
      .utc(0)
      .endOf('month')
      .add(10, 'month')
      .endOf('month')
      .unix();
    await expect(
      PeriodRegistry.initializePeriod(
        PERIOD_TYPE.MONTHLY,
        [periodStartMonthlyExpected],
        [periodEndMonthlyExpected]
      )
    ).to.emit(PeriodRegistry, 'PeriodInitialized')
      .withArgs(PERIOD_TYPE.MONTHLY, 1);

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
    )
      .to.emit(PeriodRegistry, 'PeriodInitialized')
      .withArgs(PERIOD_TYPE.DAILY, 1);

    let periodDefinition = await PeriodRegistry.getPeriodDefinitions();

    expect(periodDefinition[0].initialized).to.be.false;
    expect(periodDefinition[1].initialized).to.be.true;
    expect(periodDefinition[0].initialized).to.be.false;
    expect(periodDefinition[0].initialized).to.be.false;
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
    await expect(PeriodRegistry.getPeriodStartAndEnd(
      PERIOD_TYPE.MONTHLY,
      100
    )).to.be.revertedWith('Invalid period id');

    let periodStartExpected = moment()
      .utc(0)
      .startOf('month')
      .add(1, 'month')
      .startOf('month')
      .unix();
    let periodEndExpected = moment()
      .utc(0)
      .endOf('month')
      .add(10, 'month')
      .endOf('month')
      .unix();
    await expect(
      PeriodRegistry.initializePeriod(
        PERIOD_TYPE.MONTHLY,
        [periodStartExpected],
        [periodEndExpected]
      )
    )
      .to.emit(PeriodRegistry, 'PeriodInitialized')
      .withArgs(PERIOD_TYPE.MONTHLY, 1);
    let period = await PeriodRegistry.getPeriodStartAndEnd(
      PERIOD_TYPE.MONTHLY,
      0
    );

    let periodStartActual = period.start.toNumber();
    let periodEndActual = period.end.toNumber();
    expect(periodStartActual).to.be.equal(periodStartExpected);
    expect(periodEndActual).to.be.equal(periodEndExpected);
  })
});
