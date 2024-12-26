module.exports = (sequelize, DataTypes) => {
  const MonthlySubsRecord = sequelize.define("monthlySubsRecord", {
    plan: DataTypes.STRING,
    amount: DataTypes.INTEGER,
    paymentReference: DataTypes.STRING,
    expiresAt: DataTypes.DATE,
    VAT: DataTypes.DOUBLE,
  });

  return MonthlySubsRecord;
};
