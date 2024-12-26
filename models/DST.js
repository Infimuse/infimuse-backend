module.exports = (sequelize, Datatypes) => {
  const DST = sequelize.define("DST", {
    date: {
      type: Datatypes.DATE,
    },
    amount: Datatypes.DOUBLE,
  });
  return DST;
};
