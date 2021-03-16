import moment from 'moment';

/*
* @dev generates 2 arrays for starting and ending of periods.
* The first period (start[0], finish[0]) is the past week (so is ever finished)
* The second period is the current week, and the next periods are all future weeks.
* */

function generateWeeklyPeriods(amountOfPeriods, expiredPeriods) {
  const periodStarts = [];
  const periodEnds = [];
  for (let index = -expiredPeriods + 1; index < amountOfPeriods - expiredPeriods + 1; index += 1) {
    const start = moment().utc(0).startOf('isoWeek')
      .add(index, 'week')
      .unix();
    const end = moment().utc(0).endOf('isoWeek')
      .add(index, 'week')
      .unix();
    periodStarts.push(start);
    periodEnds.push(end);
  }
  return [periodStarts, periodEnds];
}

export default generateWeeklyPeriods;
