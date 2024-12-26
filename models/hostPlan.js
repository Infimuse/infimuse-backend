module.exports = (sequelize, DataTypes) => {
  const HostPlan = sequelize.define("hostPlan", {
    subscription: {
      type: DataTypes.STRING,
    },
    amount: DataTypes.INTEGER,
    paymentReference: DataTypes.STRING,
    email: DataTypes.STRING,
    period: DataTypes.STRING,
    expiresAt: DataTypes.DATE,
  });
  return HostPlan;
};
