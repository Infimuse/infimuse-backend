const snakeToCamelCase = (str) =>
  str.replace(/([-_][a-z0-9])/gi, ($1) =>
    $1.toUpperCase().replace("-", "").replace("_", "")
  );

const convertObjectFromSnakeToCamelCase = (obj) => {
  return Object.keys(obj).reduce((prev, cur) => {
    return { ...prev, [snakeToCamelCase(cur)]: obj[cur] };
  }, {});
};

module.exports = {
  snakeToCamelCase,
  convertObjectFromSnakeToCamelCase,
};
