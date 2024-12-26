module.exports = (sequelize, DataTypes) => {
  const InfimuseAccount = sequelize.define("infimuseAccount", {
    amount: DataTypes.DOUBLE,
    reference: DataTypes.STRING,
    transactionType: {
      type: DataTypes.ENUM,
      values: ["Subscription", "Booking"],
    },
  });
  return InfimuseAccount;
};
