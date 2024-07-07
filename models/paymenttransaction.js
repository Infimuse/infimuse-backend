"use strict";
module.exports = (sequelize, DataTypes) => {
  const PaymentTransaction = sequelize.define(
    "paymentTransaction",
    {
      amount: DataTypes.INTEGER,
      phone: { type: DataTypes.STRING, allowNull: true },
      transactionId: {
        type: DataTypes.STRING,
      },
      email: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      paymentReference: { type: DataTypes.STRING },
    },
    {}
  );
  return PaymentTransaction;
};
