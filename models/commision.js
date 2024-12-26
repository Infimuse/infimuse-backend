module.exports = (sequelize, DataTypes) => {
  const Commission = sequelize.define("commission", {
    amount: DataTypes.DOUBLE,
    reference: DataTypes.STRING,
    comissionType: {
      type: DataTypes.ENUM,
      values: ["withdrawalFee", "bookingFee"],
    },
    VAT: {
      type: DataTypes.DOUBLE,
    },
  });
  return Commission;
};
