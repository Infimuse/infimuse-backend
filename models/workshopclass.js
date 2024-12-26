"use strict";

module.exports = (sequelize, DataTypes) => {
  const WorkshopClass = sequelize.define(
    "workshopClass",
    {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      date: { type: DataTypes.DATE, allowNull: false },
      startTime: DataTypes.STRING,
      endTime: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM,
        values: ["upcoming", "canceled", "past"],
        allowNull: false,
        defaultValue: "upcoming",
      },
      attendance: { type: DataTypes.INTEGER, defaultValue: 0 },
      lastScannedAt: { type: DataTypes.DATE },
    },
    {}
  );
  return WorkshopClass;
};
