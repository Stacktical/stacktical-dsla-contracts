// using regexp to clean non ascii characters
// eslint-disable-next-line no-control-regex
const cleanSolidityString = (string) => string.replace(/[^\x1F-\x7F]+/gm, '').trim();

export default cleanSolidityString;
