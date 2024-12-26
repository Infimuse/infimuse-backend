"use strict";
const crypto = require("crypto");
module.exports = (sequelize, DataTypes) => {
  const WorkshopTicket = sequelize.define(
    "WorkshopTicket",
    {
      ticketId: DataTypes.STRING,
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
        beforeSave: async (ticket) => {
          const workshopTicket = crypto
            .randomBytes(7)
            .toString("hex")
            .toUpperCase();
          ticket.ticketId = workshopTicket;
        },
      },
    }
  );

  return WorkshopTicket;
};

// WorkshopTicket.belongsTo(models.Customer, { foreignKey: "customerId" });
// WorkshopTicket.belongsTo(models.Guest, { foreignKey: "guestId" });
// WorkshopTicket.belongsTo(models.Workshop, { foreignKey: "workshopId" });
// WorkshopTicket.belongsTo(models.PaymentTransaction, {foreignKey: "paymentTransactionId"});
