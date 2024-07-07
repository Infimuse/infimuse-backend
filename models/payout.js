"use strict";
module.exports = (sequelize, DataTypes) => {
  const Payout = sequelize.define(
    "payout",
    {
      amount: {
        type: DataTypes.DOUBLE,
      },
      type: {
        type: DataTypes.STRING,
      },
      name: {
        type: DataTypes.STRING,
      },
      account_number: {
        type: DataTypes.STRING,
      },
      currency: {
        type: DataTypes.STRING,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {}
  );

  return Payout;
};

// Payout.belongsTo(models.Host, { foreignKey: "hostId" });
