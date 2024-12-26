module.exports = (sequelize, DataTypes) => {
  const MonthlyRevenue = sequelize.define("monthlyRevenue", {
    totalRevenue: DataTypes.DOUBLE,
    accBalance: DataTypes.DOUBLE,
    netProfit: DataTypes.DOUBLE,
    subscriptionTotal: DataTypes.DOUBLE,
    bookingTotal: DataTypes.DOUBLE,
    totalDst: DataTypes.DOUBLE,
    totalVat: DataTypes.DOUBLE,
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    pendingHostPayouts: DataTypes.DOUBLE,
    totalHostPayouts: DataTypes.DOUBLE,
    withdrawnAmount: DataTypes.DOUBLE,
  });
  return MonthlyRevenue;
};
