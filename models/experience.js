"use strict";
const crypto = require("crypto");
module.exports = (sequelize, DataTypes) => {
  const Experience = sequelize.define(
    "experience",
    {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      posterUrl: DataTypes.STRING,
      date: DataTypes.DATE,
      startTime: DataTypes.TIME,
      endTime: DataTypes.TIME,
      startDate: DataTypes.DATE,
      endDate: DataTypes.DATE,
      capacity: DataTypes.INTEGER,
      fullCapacity: { type: DataTypes.BOOLEAN, defaultValue: false },
      capacityStatus: DataTypes.INTEGER,
      price: DataTypes.DOUBLE,
      ageGroup: DataTypes.STRING,
      ageMin: DataTypes.INTEGER,
      ageMax: DataTypes.INTEGER,
      token: DataTypes.STRING,
      attendance: { type: DataTypes.INTEGER, defaultValue: 0 },
      templateStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM,
        values: ["UPCOMING", "CANCELED", "PAST"],
        allowNull: false,
        defaultValue: "upcoming",
      },
      totalRating: {
        type: DataTypes.DOUBLE,
      },
      channelLink: DataTypes.STRING,
      boughtTickets: DataTypes.INTEGER,
      listingWorth: DataTypes.INTEGER,
      lastScannedAt: { type: DataTypes.DATE },
      experienceCategory: {
        type: DataTypes.ENUM,
        values: ["learning", "enriching", "kids", "sipping"],
        allowNull: false,
      },
    },
    {
      hooks: {
        beforeCreate: async (session) => {
          const token = crypto.randomBytes(6).toString("hex");
          session.token = token;
        },
      },
    }
  );
  return Experience;
};
