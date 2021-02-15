import moment from 'moment';

/*
* @dev generates 2 arrays for starting and ending of periods.
* The first period (start[0], finish[0]) is the past week (so is ever finished)
* The second period is the current week, and the next periods are all future weeks.
* */

function generatePeriods(amountOfPeriods) {
  const periodStarts = [];
  const periodEnds = [];
  const expiredPeriods = 2;
  for (let index = -expiredPeriods; index < amountOfPeriods - expiredPeriods; index += 1) {
    const start = moment().add(index, 'week').startOf('week').unix();
    const end = moment().add(index, 'week').endOf('week').unix();
    periodStarts.push(start);
    periodEnds.push(end);
  }
  return [periodStarts, periodEnds];
}

export default generatePeriods;
