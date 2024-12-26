module.exports = (sequelize, DataTypes) => {
  const Withdrawals = sequelize.define(
    "withdrawal",
    {
      name: DataTypes.STRING,
      accountNumber: DataTypes.STRING,
      email: DataTypes.STRING,
      reference_code: { type: DataTypes.STRING },
      amount: DataTypes.INTEGER,
    },
    {}
  );
  return Withdrawals;
};
