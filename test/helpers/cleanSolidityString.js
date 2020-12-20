// using regexp to clean non ascii characters
export const cleanSolidityString = (string) => {
  return string.replace(/[^\x1F-\x7F]+/gm, "").trim();
};
