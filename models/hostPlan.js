module.exports = (sequelize, DataTypes) => {
  const HostPlan = sequelize.define("hostPlan", {
    subscription: {
      type: DataTypes.STRING,
    },
    amount: DataTypes.INTEGER,
    paymentReference: DataTypes.STRING,
    email: DataTypes.STRING,
  });
  return HostPlan;
};
