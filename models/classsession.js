"use strict";
const crypto = require("crypto");
module.exports = (sequelize, DataTypes) => {
  const ClassSession = sequelize.define(
    "classSession",
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
      fullCapacity: DataTypes.INTEGER,
      capacityStatus: DataTypes.INTEGER,
      price: DataTypes.DOUBLE,
      ageGroup: DataTypes.STRING,
      ageMin: DataTypes.INTEGER,
      ageMax: DataTypes.INTEGER,
      token: DataTypes.STRING,
      totalSessions: DataTypes.INTEGER,
      templateStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      attendance: { type: DataTypes.INTEGER, defaultValue: 0 },
      status: {
        type: DataTypes.ENUM,
        values: ["UPCOMING", "CANCELED", "PAST"],
        allowNull: false,
        defaultValue: "upcoming",
      },
      classCategory: {
        type: DataTypes.ENUM,
        values: ["learning", "enriching", "kids", "sipping"],
        allowNull: false,
      },
      totalRating: {
        type: DataTypes.DOUBLE,
      },
      channelLink: DataTypes.STRING,
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
  return ClassSession;
};

// ClassSession.hasMany(models.ClassTicket);
// ClassSession.hasMany(models.Location);
// ClassSession.hasOne(models.Waitlist, { foreignKey: "waitlistID" });
// ClassSession.belongsTo(models.Host, { foreignKey: "hostId" });
