"use strict";
const crypto = require("crypto");
module.exports = (sequelize, DataTypes) => {
  const ClassTicket = sequelize.define(
    "ClassTicket",

    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },

      ticketId: {
        type: DataTypes.STRING,
      },
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
          const classTicket = crypto
            .randomBytes(7)
            .toString("hex")
            .toUpperCase();
          ticket.ticketId = classTicket;
        },
      },
    }
  );

  return ClassTicket;
};
