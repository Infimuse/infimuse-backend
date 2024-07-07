"use strict";
const crypto = require("crypto");
module.exports = (sequelize, DataTypes) => {
  const PackageTicket = sequelize.define(
    "packageTicket",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      ticketId: DataTypes.STRING,
      completed: DataTypes.BOOLEAN,
      numberOfSession: DataTypes.INTEGER,
      ticketStatus: {
        type: DataTypes.ENUM,
        values: ["COMPLETE", "CANCELED", "ACTIVE", "REFUND", "IN-USE"],
        defaultValue: "ACTIVE",
      },
      groupTicket: { type: DataTypes.BOOLEAN, defaultValue: false },
      groupNumber: {
        type: DataTypes.INTEGER,
      },
      amount: DataTypes.INTEGER,
      paymentReference: DataTypes.STRING,
      email: DataTypes.STRING,
      name: DataTypes.STRING,
    },
    {
      hooks: {
        beforeCreate: async (user) => {
          const ticket = crypto.randomBytes(10).toString("hex");
          user.ticketId = ticket;
        },
      },
    }
  );

  return PackageTicket;
};

// PackageTicket.belongsTo(models.Customer, { foreignKey: "customerId" });
// PackageTicket.belongsTo(models.PackageClass, {
//   foreignKey: "packageClassId",
// });
// PackageTicket.belongsTo(models.Guest, { foreignKey: "guestId" });
// PackageTicket.belongsTo(models.PaymenTransaction, {
//   foreignKey: "paymentTransactionId",
// });
