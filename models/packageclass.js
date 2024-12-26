"use strict";
const crypto = require("crypto");
module.exports = (sequelize, DataTypes) => {
  const PackageClass = sequelize.define(
    "packageClass",
    {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      posterUrl: DataTypes.STRING,
      duration: DataTypes.TIME,
      startDate: { type: DataTypes.DATE, allowNull: false },
      endDate: { type: DataTypes.DATE, allowNull: false },
      capacity: DataTypes.INTEGER,
      price: DataTypes.DOUBLE,
      capacityStatus: DataTypes.BOOLEAN,
      fullCapacity: { type: DataTypes.BOOLEAN, defaultValue: false },
      ageGroup: DataTypes.STRING,
      ageMin: DataTypes.INTEGER,
      ageMax: DataTypes.INTEGER,
      token: DataTypes.STRING,
      totalSessions: DataTypes.INTEGER,
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
  return PackageClass;
};
// PackageClass.belongsTo(models.Host, { foreignKey: "hostId" });
// PackageClass.hasMany(models.PackageTicket);
// PackageClass.hasOne(models.Waitlist, { foreignKey: "waitlistId" });
// PackageClass.hasMany(models.PackageSession);
