module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define("wallet", {
    walletAmount: { type: DataTypes.INTEGER },
  });

  return Wallet;
};
