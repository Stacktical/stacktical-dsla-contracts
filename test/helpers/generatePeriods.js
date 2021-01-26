import moment from 'moment';

function generatePeriods(amountOfPeriods) {
  const periodStarts = [];
  const periodEnds = [];
  for (let index = -1; index < amountOfPeriods - 1; index += 1) {
    const start = moment().add(index, 'week').startOf('week').unix();
    const end = moment().add(index, 'week').endOf('week').unix();
    periodStarts.push(start);
    periodEnds.push(end);
  }
  return [periodStarts, periodEnds];
}

export default generatePeriods;
