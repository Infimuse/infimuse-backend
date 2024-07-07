module.exports = (sequelize, DataTypes) => {
  const HostPaymentPlanTransaction = sequelize.define(
    "hostPaymentPlanTransaction",
    {
      amount: DataTypes.INTEGER,
      hostId: { type: DataTypes.INTEGER, allowNull: false },
      hostPlanId: { type: DataTypes.INTEGER, allowNull: false },
      paymentReference: DataTypes.STRING,
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      recur: DataTypes.BOOLEAN,
    }
  );
  return HostPaymentPlanTransaction;
};
